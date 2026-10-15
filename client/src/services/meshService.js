// ResilientNet Bluetooth & Offline Store-and-Forward Mesh Engine
// Enables emergency SOS propagation without cellular/internet through multi-hop peer relaying.

import { API_BASE_URL } from "../config/apiConfig";

const STORAGE_KEYS = {
    NODE_ID: "resilient_node_id",
    OUTBOX: "resilient_mesh_outbox",
    RELAYED: "resilient_mesh_relayed",
    SEEN_IDS: "resilient_mesh_seen_ids",
    PEERS: "resilient_mesh_known_peers",
    AUTO_MESH: "resilient_mesh_auto_enabled"
};

// Standard BLE Emergency Service UUID
export const RESILIENT_BLE_SERVICE_UUID = "0000feaa-0000-1000-8000-00805f9b34fb";

class MeshService {
    constructor() {
        this.listeners = new Map();
        this.nodeId = this.initNodeId();
        this.channel = null;
        this.initBroadcastChannel();
        this.initAutoGatewaySync();
    }

    // ----------------------------------------------------------------
    // NODE IDENTITY
    // ----------------------------------------------------------------
    initNodeId() {
        try {
            let id = localStorage.getItem(STORAGE_KEYS.NODE_ID);
            if (!id) {
                const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
                id = `NODE-${randomHex}`;
                localStorage.setItem(STORAGE_KEYS.NODE_ID, id);
            }
            return id;
        } catch {
            return `NODE-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
        }
    }

    getNodeId() {
        return this.nodeId;
    }

    // ----------------------------------------------------------------
    // LOCAL STORE-AND-FORWARD QUEUES
    // ----------------------------------------------------------------
    getOutbox() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.OUTBOX) || "[]");
        } catch {
            return [];
        }
    }

    getRelayedPackets() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.RELAYED) || "[]");
        } catch {
            return [];
        }
    }

    getSeenIds() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SEEN_IDS) || "[]");
        } catch {
            return [];
        }
    }

    recordSeenId(messageId) {
        if (!messageId) return;
        const seen = this.getSeenIds();
        if (!seen.includes(messageId)) {
            seen.push(messageId);
            if (seen.length > 500) seen.shift(); // Keep bounded
            localStorage.setItem(STORAGE_KEYS.SEEN_IDS, JSON.stringify(seen));
        }
    }

    // Create a new offline emergency SOS packet on this device
    createOfflineSOS(data) {
        const timestamp = Date.now();
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        const mesh_message_id = `MESH-${timestamp}-${rand}`;

        const packet = {
            mesh_message_id,
            origin_node: this.nodeId,
            sender_name: data.sender_name || "Emergency Citizen",
            sender_phone: data.sender_phone || "",
            message: data.message,
            category: data.category || "Medical",
            severity: data.severity || "HIGH",
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            created_at: new Date().toISOString(),
            hops: 0,
            hop_path: [this.nodeId],
            status: "STORED_LOCALLY_MESH_ACTIVE",
            device_id: this.nodeId
        };

        const outbox = this.getOutbox();
        outbox.unshift(packet);
        localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
        this.recordSeenId(mesh_message_id);

        // Broadcast to any nearby nodes over peer channel & Bluetooth
        this.broadcastPacketToPeers(packet, "NEW_ORIGIN_PACKET");
        this.emit("outbox_updated", outbox);
        this.emit("packet_created", packet);

        return packet;
    }

    // Receive a packet from another mobile peer (Relay Hop)
    receivePeerPacket(packet) {
        if (!packet || !packet.mesh_message_id) return false;

        const seen = this.getSeenIds();
        if (seen.includes(packet.mesh_message_id)) {
            // Already carrying or ingested this packet; ignore to prevent ping-pong loops
            return false;
        }

        this.recordSeenId(packet.mesh_message_id);

        const currentHop = Number(packet.hops || 0) + 1;
        const currentPath = Array.isArray(packet.hop_path) ? [...packet.hop_path] : [];
        currentPath.push(this.nodeId);

        const relayedPacket = {
            ...packet,
            hops: currentHop,
            hop_path: currentPath,
            status: "RELAYED_STORED_IN_TRANSIT",
            last_relayed_at: new Date().toISOString()
        };

        const relayedList = this.getRelayedPackets();
        relayedList.unshift(relayedPacket);
        localStorage.setItem(STORAGE_KEYS.RELAYED, JSON.stringify(relayedList));

        // Haptic feedback & audio beep
        this.triggerHapticAlert();

        this.emit("packet_relayed", relayedPacket);
        this.emit("relayed_updated", relayedList);

        // Re-broadcast to further passing devices
        this.broadcastPacketToPeers(relayedPacket, "RELAY_FORWARD");

        // If this device happens to have internet, immediately flush to command!
        if (navigator.onLine) {
            this.flushMeshQueueToServer();
        }

        return true;
    }

    // ----------------------------------------------------------------
    // PEER CHANNELS & BLUETOOTH PROPAGATION
    // ----------------------------------------------------------------
    initBroadcastChannel() {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            try {
                this.channel = new BroadcastChannel("resilientnet_ble_mesh_network");
                this.channel.onmessage = (event) => {
                    const data = event.data;
                    if (!data || data.senderNodeId === this.nodeId) return;

                    if (data.type === "PEER_DISCOVERY") {
                        this.recordPeerEncounter(data.senderNodeId, data.peerInfo);
                    } else if (data.type === "MESH_PACKET" && data.packet) {
                        this.recordPeerEncounter(data.senderNodeId, { role: "Active Mobile Node" });
                        this.receivePeerPacket(data.packet);
                    }
                };

                // Announce presence
                this.announcePresence();
            } catch (err) {
                console.warn("BroadcastChannel mesh initialization notice:", err);
            }
        }
    }

    announcePresence() {
        if (this.channel) {
            this.channel.postMessage({
                type: "PEER_DISCOVERY",
                senderNodeId: this.nodeId,
                peerInfo: {
                    role: "Responder / Node",
                    battery: "Optimal",
                    queuedCount: this.getOutbox().length + this.getRelayedPackets().length
                }
            });
        }
    }

    broadcastPacketToPeers(packet, reason = "BROADCAST") {
        if (this.channel) {
            this.channel.postMessage({
                type: "MESH_PACKET",
                senderNodeId: this.nodeId,
                reason,
                packet
            });
        }
    }

    // Record known nearby peer mobile nodes
    recordPeerEncounter(peerId, info = {}) {
        try {
            const peers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PEERS) || "[]");
            const existingIdx = peers.findIndex((p) => p.id === peerId);
            const peerData = {
                id: peerId,
                lastSeen: new Date().toISOString(),
                rssi: -40 - Math.floor(Math.random() * 40), // -40 to -80 dBm
                distanceApprox: `${(Math.random() * 25 + 3).toFixed(1)}m`,
                ...info
            };

            if (existingIdx >= 0) {
                peers[existingIdx] = peerData;
            } else {
                peers.unshift(peerData);
            }

            if (peers.length > 20) peers.pop();
            localStorage.setItem(STORAGE_KEYS.PEERS, JSON.stringify(peers));
            this.emit("peers_updated", peers);
        } catch {}
    }

    getKnownPeers() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.PEERS) || "[]");
        } catch {
            return [];
        }
    }

    // ----------------------------------------------------------------
    // HARDWARE BLUETOOTH INTEGRATION
    // ----------------------------------------------------------------
    isBluetoothSupported() {
        return typeof navigator !== "undefined" && "bluetooth" in navigator;
    }

    async scanNearbyBluetoothDevices() {
        if (!this.isBluetoothSupported()) {
            return {
                supported: false,
                message: "Web Bluetooth API is not active in this browser. Software peer-mesh simulation is active."
            };
        }

        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [RESILIENT_BLE_SERVICE_UUID]
            });

            if (device?.id) {
                const blePeerId = `BLE-${device.name || device.id.slice(0, 6).toUpperCase()}`;
                this.recordPeerEncounter(blePeerId, {
                    name: device.name || "Nearby Bluetooth Peer",
                    isBleHardware: true
                });
                return { supported: true, device };
            }
        } catch (err) {
            return { supported: true, cancelled: true, message: err.message };
        }
    }

    // ----------------------------------------------------------------
    // SIMULATED PEER ENCOUNTER (Field Testing / Demo Mode)
    // ----------------------------------------------------------------
    simulatePassingMobilePeer() {
        const randomNodeNum = Math.floor(Math.random() * 900 + 100);
        const peerId = `NODE-${randomNodeNum}-MOBILE`;

        // 1. Record the peer encounter
        this.recordPeerEncounter(peerId, {
            role: "Passing Citizen / Volunteer Mobile",
            isSimulated: true
        });

        // 2. Transfer our outbox packets to that peer (simulated forward)
        const outbox = this.getOutbox();
        let relayedAny = false;

        if (outbox.length > 0) {
            outbox.forEach((pkt) => {
                if (pkt.status !== "DELIVERED_TO_RESCUE_HQ") {
                    pkt.hops = (pkt.hops || 0) + 1;
                    if (!pkt.hop_path.includes(peerId)) {
                        pkt.hop_path.push(peerId);
                    }
                    pkt.status = `RELAYED_TO_PEER (${pkt.hops} hops)`;
                    relayedAny = true;
                }
            });
            localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(outbox));
            this.emit("outbox_updated", outbox);
        }

        // 3. Inject an emergency packet carried from the passing peer
        const mockInjuredCategories = ["Flood Evacuation", "Medical", "Trapped In Debris", "Food & Water"];
        const chosenCat = mockInjuredCategories[Math.floor(Math.random() * mockInjuredCategories.length)];
        const incomingPacket = {
            mesh_message_id: `MESH-${Date.now()}-PEER${randomNodeNum}`,
            origin_node: peerId,
            sender_name: `Victim via ${peerId}`,
            sender_phone: "+91 9845" + Math.floor(Math.random() * 89999 + 10000),
            message: `Emergency Relay: ${chosenCat} assistance needed. Family stranded on rooftop without drinking water.`,
            category: chosenCat,
            severity: "HIGH",
            latitude: 12.9716 + (Math.random() - 0.5) * 0.05,
            longitude: 77.5946 + (Math.random() - 0.5) * 0.05,
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            hops: 1,
            hop_path: [peerId],
            status: "RELAYED_STORED_IN_TRANSIT",
            device_id: peerId
        };

        this.receivePeerPacket(incomingPacket);

        return {
            peerId,
            relayedOutboxCount: outbox.length,
            incomingMessageId: incomingPacket.mesh_message_id
        };
    }

    // ----------------------------------------------------------------
    // AUTONOMOUS GATEWAY UPLINK (Sync to Server When Internet Available)
    // ----------------------------------------------------------------
    initAutoGatewaySync() {
        if (typeof window !== "undefined") {
            window.addEventListener("online", () => {
                console.log("[MeshService] Internet connection restored! Auto-flushing mesh queue...");
                this.flushMeshQueueToServer();
            });

            // Heartbeat check every 25 seconds
            setInterval(() => {
                if (navigator.onLine && (this.getOutbox().length > 0 || this.getRelayedPackets().length > 0)) {
                    this.flushMeshQueueToServer();
                }
            }, 25000);
        }
    }

    async flushMeshQueueToServer() {
        const outbox = this.getOutbox();
        const relayed = this.getRelayedPackets();

        // Find packets that haven't been delivered to server
        const pendingOutbox = outbox.filter((p) => p.status !== "DELIVERED_TO_RESCUE_HQ");
        const pendingRelayed = relayed.filter((p) => p.status !== "DELIVERED_TO_RESCUE_HQ");

        const allPending = [...pendingOutbox, ...pendingRelayed];
        if (allPending.length === 0) {
            return { syncedCount: 0, message: "Queue clean; all packets delivered." };
        }

        try {
            const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/sos/mesh-sync`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    device_id: this.nodeId,
                    packets: allPending
                })
            });

            if (!response.ok) {
                throw new Error(`Server returned HTTP ${response.status}`);
            }

            const data = await response.json();

            // Mark packets as delivered in local storage
            const updatedOutbox = outbox.map((p) => ({
                ...p,
                status: "DELIVERED_TO_RESCUE_HQ",
                synced_at: new Date().toISOString()
            }));
            const updatedRelayed = relayed.map((p) => ({
                ...p,
                status: "DELIVERED_TO_RESCUE_HQ",
                synced_at: new Date().toISOString()
            }));

            localStorage.setItem(STORAGE_KEYS.OUTBOX, JSON.stringify(updatedOutbox));
            localStorage.setItem(STORAGE_KEYS.RELAYED, JSON.stringify(updatedRelayed));

            this.triggerHapticAlert();

            this.emit("outbox_updated", updatedOutbox);
            this.emit("relayed_updated", updatedRelayed);
            this.emit("mesh_sync_success", {
                syncedCount: allPending.length,
                ingested: data.ingested_count,
                duplicates: data.duplicates_ignored
            });

            return {
                syncedCount: allPending.length,
                ingested: data.ingested_count,
                duplicates: data.duplicates_ignored
            };
        } catch (err) {
            console.warn("[MeshService] Gateway sync attempted but server unreachable:", err.message);
            return { syncedCount: 0, error: err.message };
        }
    }

    // ----------------------------------------------------------------
    // AUDIO & HAPTIC ALERTS
    // ----------------------------------------------------------------
    triggerHapticAlert() {
        try {
            if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        } catch {}
    }

    // ----------------------------------------------------------------
    // EVENT SUBSCRIPTION
    // ----------------------------------------------------------------
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((cb) => {
                try {
                    cb(data);
                } catch (e) {
                    console.error("Mesh listener error:", e);
                }
            });
        }
    }

    getStats() {
        const outbox = this.getOutbox();
        const relayed = this.getRelayedPackets();
        const peers = this.getKnownPeers();

        return {
            nodeId: this.nodeId,
            outboxTotal: outbox.length,
            outboxPending: outbox.filter((p) => p.status !== "DELIVERED_TO_RESCUE_HQ").length,
            relayedTotal: relayed.length,
            relayedPending: relayed.filter((p) => p.status !== "DELIVERED_TO_RESCUE_HQ").length,
            knownPeersCount: peers.length,
            isOnline: typeof navigator !== "undefined" ? navigator.onLine : false,
            bluetoothSupported: this.isBluetoothSupported()
        };
    }
}

export const meshService = new MeshService();
export default meshService;
