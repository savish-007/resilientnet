--
-- PostgreSQL database dump
--

\restrict nn7oEDXmi2ipF1vh3hOy57rtgSgeloiabVx5BFv3slTuWK52rADcPOs6SUvU7Gk

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    priority_score numeric(5,2),
    predicted_category character varying(50),
    confidence numeric(5,2),
    recommendation text,
    analyzed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recommended_resource character varying(100),
    estimated_response_time character varying(50),
    incident_id uuid NOT NULL
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sos_id uuid,
    volunteer_id uuid,
    resource_id uuid,
    assigned_by uuid,
    status character varying(30) DEFAULT 'ASSIGNED'::character varying,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone
);


--
-- Name: incidents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incidents (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_number character varying(30) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    status character varying(30) DEFAULT 'NEW'::character varying NOT NULL,
    location public.geography(Point,4326) NOT NULL,
    report_count integer DEFAULT 1 NOT NULL,
    created_by uuid NOT NULL,
    verified_by uuid,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT incidents_severity_check CHECK (((severity)::text = ANY (ARRAY[('LOW'::character varying)::text, ('MEDIUM'::character varying)::text, ('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text]))),
    CONSTRAINT incidents_status_check CHECK (((status)::text = ANY (ARRAY[('NEW'::character varying)::text, ('VERIFIED'::character varying)::text, ('RESOURCE_REQUESTED'::character varying)::text, ('IN_PROGRESS'::character varying)::text, ('RESOLVED'::character varying)::text, ('CLOSED'::character varying)::text])))
);


--
-- Name: daily_incident_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.daily_incident_statistics AS
 SELECT date(created_at) AS incident_date,
    count(*) AS total_incidents,
    count(*) FILTER (WHERE ((severity)::text = 'HIGH'::text)) AS high_severity,
    count(*) FILTER (WHERE ((severity)::text = 'CRITICAL'::text)) AS critical_severity,
    count(*) FILTER (WHERE ((status)::text = 'RESOLVED'::text)) AS resolved
   FROM public.incidents
  GROUP BY (date(created_at))
  ORDER BY (date(created_at));


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    title character varying(150) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incident_id uuid,
    notification_type character varying(50) NOT NULL,
    read_at timestamp without time zone,
    metadata jsonb,
    CONSTRAINT notifications_type_check CHECK (((notification_type)::text = ANY (ARRAY[('NEW_SOS'::character varying)::text, ('INCIDENT_UPDATED'::character varying)::text, ('RESOURCE_REQUESTED'::character varying)::text, ('RESOURCE_ALLOCATED'::character varying)::text, ('VOLUNTEER_ASSIGNED'::character varying)::text, ('INCIDENT_RESOLVED'::character varying)::text, ('SYSTEM'::character varying)::text])))
);


--
-- Name: resource_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_id uuid NOT NULL,
    requested_by uuid NOT NULL,
    resource_category character varying(100) NOT NULL,
    resource_name character varying(200),
    quantity_requested integer NOT NULL,
    quantity_allocated integer DEFAULT 0 NOT NULL,
    unit character varying(50),
    priority character varying(20) DEFAULT 'MEDIUM'::character varying NOT NULL,
    status character varying(30) DEFAULT 'REQUESTED'::character varying NOT NULL,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fulfilled_at timestamp without time zone,
    notes text,
    CONSTRAINT resource_requests_allocated_check CHECK (((quantity_allocated >= 0) AND (quantity_allocated <= quantity_requested))),
    CONSTRAINT resource_requests_priority_check CHECK (((priority)::text = ANY (ARRAY[('LOW'::character varying)::text, ('MEDIUM'::character varying)::text, ('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text]))),
    CONSTRAINT resource_requests_quantity_check CHECK ((quantity_requested > 0)),
    CONSTRAINT resource_requests_status_check CHECK (((status)::text = ANY (ARRAY[('REQUESTED'::character varying)::text, ('APPROVED'::character varying)::text, ('PARTIALLY_ALLOCATED'::character varying)::text, ('ALLOCATED'::character varying)::text, ('FULFILLED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    name character varying(100) NOT NULL,
    category character varying(50),
    quantity integer NOT NULL,
    unit character varying(20),
    status character varying(20) DEFAULT 'AVAILABLE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    latitude double precision,
    longitude double precision,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: volunteer_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_assignments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    volunteer_id uuid NOT NULL,
    incident_id uuid NOT NULL,
    assigned_by uuid,
    status character varying(30) DEFAULT 'ASSIGNED'::character varying NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    CONSTRAINT volunteer_assignments_status_check CHECK (((status)::text = ANY (ARRAY[('ASSIGNED'::character varying)::text, ('IN_PROGRESS'::character varying)::text, ('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text])))
);


--
-- Name: volunteers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    skills text,
    availability character varying(20) DEFAULT true,
    current_location public.geography(Point,4326),
    last_seen timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dashboard_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dashboard_statistics AS
 SELECT ( SELECT count(*) AS count
           FROM public.incidents
          WHERE ((incidents.status)::text = ANY (ARRAY[('NEW'::character varying)::text, ('VERIFIED'::character varying)::text, ('RESOURCE_REQUESTED'::character varying)::text, ('IN_PROGRESS'::character varying)::text]))) AS active_incidents,
    ( SELECT count(*) AS count
           FROM public.incidents
          WHERE (((incidents.severity)::text = ANY (ARRAY[('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text])) AND ((incidents.status)::text <> ALL (ARRAY[('RESOLVED'::character varying)::text, ('CLOSED'::character varying)::text])))) AS high_priority_incidents,
    ( SELECT count(*) AS count
           FROM public.resources
          WHERE ((resources.status)::text = 'AVAILABLE'::text)) AS available_resources,
    ( SELECT count(*) AS count
           FROM public.volunteers
          WHERE ((volunteers.availability)::text = 'AVAILABLE'::text)) AS available_volunteers,
    ( SELECT count(*) AS count
           FROM public.resource_requests
          WHERE ((resource_requests.status)::text = ANY (ARRAY[('REQUESTED'::character varying)::text, ('APPROVED'::character varying)::text, ('PARTIALLY_ALLOCATED'::character varying)::text]))) AS pending_resource_requests,
    ( SELECT count(*) AS count
           FROM public.volunteer_assignments
          WHERE ((volunteer_assignments.status)::text = ANY (ARRAY[('ASSIGNED'::character varying)::text, ('IN_PROGRESS'::character varying)::text]))) AS active_volunteer_assignments,
    ( SELECT count(*) AS count
           FROM public.notifications
          WHERE (notifications.is_read = false)) AS unread_notifications;


--
-- Name: incident_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incident_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT incident_comments_comment_check CHECK ((length(TRIM(BOTH FROM comment)) > 0))
);


--
-- Name: incident_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incident_timeline (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    incident_id uuid NOT NULL,
    user_id uuid,
    event_type character varying(50) NOT NULL,
    event_description text NOT NULL,
    old_status character varying(30),
    new_status character varying(30),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT incident_timeline_event_type_check CHECK (((event_type)::text = ANY (ARRAY[('INCIDENT_CREATED'::character varying)::text, ('INCIDENT_VERIFIED'::character varying)::text, ('STATUS_CHANGED'::character varying)::text, ('AI_ANALYSIS_CREATED'::character varying)::text, ('RESOURCE_REQUESTED'::character varying)::text, ('RESOURCE_ALLOCATED'::character varying)::text, ('VOLUNTEER_ASSIGNED'::character varying)::text, ('INCIDENT_RESOLVED'::character varying)::text, ('INCIDENT_CLOSED'::character varying)::text, ('COMMENT_ADDED'::character varying)::text])))
);


--
-- Name: emergency_summary_report; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.emergency_summary_report AS
 SELECT i.id AS incident_id,
    i.incident_number,
    i.title,
    i.category,
    i.severity,
    i.status,
    i.created_at,
    COALESCE(rr.resource_requests, (0)::bigint) AS resource_requests,
    COALESCE(rr.resources_allocated, (0)::bigint) AS resources_allocated,
    COALESCE(va.volunteers_assigned, (0)::bigint) AS volunteers_assigned,
    COALESCE(ic.comment_count, (0)::bigint) AS comment_count,
    COALESCE(it.timeline_event_count, (0)::bigint) AS timeline_event_count
   FROM ((((public.incidents i
     LEFT JOIN ( SELECT resource_requests.incident_id,
            count(*) AS resource_requests,
            COALESCE(sum(resource_requests.quantity_allocated), (0)::bigint) AS resources_allocated
           FROM public.resource_requests
          GROUP BY resource_requests.incident_id) rr ON ((i.id = rr.incident_id)))
     LEFT JOIN ( SELECT volunteer_assignments.incident_id,
            count(*) AS volunteers_assigned
           FROM public.volunteer_assignments
          WHERE ((volunteer_assignments.status)::text <> 'CANCELLED'::text)
          GROUP BY volunteer_assignments.incident_id) va ON ((i.id = va.incident_id)))
     LEFT JOIN ( SELECT incident_comments.incident_id,
            count(*) AS comment_count
           FROM public.incident_comments
          GROUP BY incident_comments.incident_id) ic ON ((i.id = ic.incident_id)))
     LEFT JOIN ( SELECT incident_timeline.incident_id,
            count(*) AS timeline_event_count
           FROM public.incident_timeline
          GROUP BY incident_timeline.incident_id) it ON ((i.id = it.incident_id)))
  ORDER BY i.created_at DESC;


--
-- Name: incident_category_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.incident_category_statistics AS
 SELECT category,
    count(*) AS incident_count,
    count(*) FILTER (WHERE ((severity)::text = ANY (ARRAY[('HIGH'::character varying)::text, ('CRITICAL'::character varying)::text]))) AS high_priority_count
   FROM public.incidents
  GROUP BY category
  ORDER BY (count(*)) DESC;


--
-- Name: incident_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incident_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sos_id uuid,
    action character varying(100) NOT NULL,
    performed_by uuid,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    phone character varying(20),
    role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    organization_id uuid,
    token_version integer DEFAULT 0 NOT NULL
);


--
-- Name: incident_history_report; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.incident_history_report AS
 SELECT t.id AS timeline_id,
    i.incident_number,
    i.title AS incident_title,
    t.event_type,
    t.event_description,
    t.old_status,
    t.new_status,
    u.full_name AS performed_by,
    t.metadata,
    t.created_at
   FROM ((public.incident_timeline t
     JOIN public.incidents i ON ((t.incident_id = i.id)))
     LEFT JOIN public.users u ON ((t.user_id = u.id)))
  ORDER BY t.created_at DESC;


--
-- Name: incident_report; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.incident_report AS
 SELECT id,
    incident_number,
    title,
    category,
    severity,
    status,
    description,
    location,
    created_at,
    updated_at
   FROM public.incidents i
  ORDER BY created_at DESC;


--
-- Name: incident_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.incident_statistics AS
 SELECT count(*) AS total_incidents,
    count(*) FILTER (WHERE ((status)::text = ANY (ARRAY[('NEW'::character varying)::text, ('VERIFIED'::character varying)::text, ('RESOURCE_REQUESTED'::character varying)::text, ('IN_PROGRESS'::character varying)::text]))) AS active_incidents,
    count(*) FILTER (WHERE ((status)::text = 'RESOLVED'::text)) AS resolved_incidents,
    count(*) FILTER (WHERE ((status)::text = 'CLOSED'::text)) AS closed_incidents,
    count(*) FILTER (WHERE ((severity)::text = 'LOW'::text)) AS low_severity,
    count(*) FILTER (WHERE ((severity)::text = 'MEDIUM'::text)) AS medium_severity,
    count(*) FILTER (WHERE ((severity)::text = 'HIGH'::text)) AS high_severity,
    count(*) FILTER (WHERE ((severity)::text = 'CRITICAL'::text)) AS critical_severity
   FROM public.incidents;


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT resource_centers_id_not_null NOT NULL,
    name character varying(100) CONSTRAINT resource_centers_name_not_null NOT NULL,
    address text,
    phone character varying(20),
    headquarters_location public.geography(Point,4326),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(50) NOT NULL,
    email character varying(150),
    status character varying(20) DEFAULT 'ACTIVE'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: resource_request_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.resource_request_statistics AS
 SELECT count(*) AS total_requests,
    count(*) FILTER (WHERE ((status)::text = 'REQUESTED'::text)) AS requested,
    count(*) FILTER (WHERE ((status)::text = 'APPROVED'::text)) AS approved,
    count(*) FILTER (WHERE ((status)::text = 'PARTIALLY_ALLOCATED'::text)) AS partially_allocated,
    count(*) FILTER (WHERE ((status)::text = 'ALLOCATED'::text)) AS allocated,
    count(*) FILTER (WHERE ((status)::text = 'FULFILLED'::text)) AS fulfilled,
    count(*) FILTER (WHERE ((status)::text = 'CANCELLED'::text)) AS cancelled
   FROM public.resource_requests;


--
-- Name: resource_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.resource_statistics AS
 SELECT count(*) AS total_resources,
    COALESCE(sum(quantity), (0)::bigint) AS total_quantity,
    count(*) FILTER (WHERE ((status)::text = 'AVAILABLE'::text)) AS available_resources,
    count(*) FILTER (WHERE ((status)::text = 'ALLOCATED'::text)) AS allocated_resources,
    count(*) FILTER (WHERE ((status)::text = 'UNAVAILABLE'::text)) AS unavailable_resources
   FROM public.resources;


--
-- Name: resource_utilization_report; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.resource_utilization_report AS
 SELECT rr.id AS request_id,
    i.incident_number,
    i.title AS incident_title,
    rr.resource_category,
    rr.resource_name,
    rr.quantity_requested,
    rr.quantity_allocated,
    rr.unit,
    rr.priority,
    rr.status,
    rr.requested_at,
    rr.fulfilled_at
   FROM (public.resource_requests rr
     JOIN public.incidents i ON ((rr.incident_id = i.id)))
  ORDER BY rr.requested_at DESC;


--
-- Name: sos_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sos_reports (
    id uuid DEFAULT gen_random_uuid() CONSTRAINT sos_alerts_id_not_null NOT NULL,
    sender_id uuid,
    message text CONSTRAINT sos_alerts_message_not_null NOT NULL,
    category character varying(50),
    severity character varying(20),
    status character varying(20) DEFAULT 'NEW'::character varying,
    location public.geography(Point,4326),
    mesh_message_id character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    incident_id uuid NOT NULL
);


--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying(100) NOT NULL,
    mesh_message_id character varying(100) NOT NULL,
    sync_status character varying(30) DEFAULT 'PENDING'::character varying,
    synced_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: volunteer_activity_report; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.volunteer_activity_report AS
 SELECT va.id AS assignment_id,
    u.full_name AS volunteer_name,
    u.email AS volunteer_email,
    i.incident_number,
    i.title AS incident_title,
    i.category,
    i.severity,
    va.status AS assignment_status,
    va.assigned_at,
    va.started_at,
    va.completed_at,
    va.notes
   FROM (((public.volunteer_assignments va
     JOIN public.volunteers v ON ((va.volunteer_id = v.id)))
     JOIN public.users u ON ((v.user_id = u.id)))
     JOIN public.incidents i ON ((va.incident_id = i.id)))
  ORDER BY va.assigned_at DESC;


--
-- Name: volunteer_assignment_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.volunteer_assignment_statistics AS
 SELECT count(*) AS total_assignments,
    count(*) FILTER (WHERE ((status)::text = 'ASSIGNED'::text)) AS assigned,
    count(*) FILTER (WHERE ((status)::text = 'IN_PROGRESS'::text)) AS in_progress,
    count(*) FILTER (WHERE ((status)::text = 'COMPLETED'::text)) AS completed,
    count(*) FILTER (WHERE ((status)::text = 'CANCELLED'::text)) AS cancelled
   FROM public.volunteer_assignments;


--
-- Name: volunteer_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.volunteer_statistics AS
 SELECT count(*) AS total_volunteers,
    count(*) FILTER (WHERE ((availability)::text = 'AVAILABLE'::text)) AS available_volunteers,
    count(*) FILTER (WHERE ((availability)::text = 'BUSY'::text)) AS busy_volunteers,
    count(*) FILTER (WHERE ((availability)::text = 'OFFLINE'::text)) AS offline_volunteers
   FROM public.volunteers;


--
-- Name: ai_analysis ai_analysis_incident_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_incident_id_key UNIQUE (incident_id);


--
-- Name: ai_analysis ai_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: incident_comments incident_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_pkey PRIMARY KEY (id);


--
-- Name: incident_history incident_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_pkey PRIMARY KEY (id);


--
-- Name: incident_timeline incident_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_timeline
    ADD CONSTRAINT incident_timeline_pkey PRIMARY KEY (id);


--
-- Name: incidents incidents_incident_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_incident_number_key UNIQUE (incident_number);


--
-- Name: incidents incidents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT incidents_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_hash_key UNIQUE (token_hash);


--
-- Name: organizations resource_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT resource_centers_pkey PRIMARY KEY (id);


--
-- Name: resource_requests resource_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_requests
    ADD CONSTRAINT resource_requests_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: sos_reports sos_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sos_reports
    ADD CONSTRAINT sos_alerts_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_mesh_message_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_mesh_message_id_key UNIQUE (mesh_message_id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: volunteer_assignments volunteer_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_assignments
    ADD CONSTRAINT volunteer_assignments_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_pkey PRIMARY KEY (id);


--
-- Name: volunteers volunteers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_user_id_key UNIQUE (user_id);


--
-- Name: idx_incident_comments_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_comments_created ON public.incident_comments USING btree (created_at);


--
-- Name: idx_incident_comments_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_comments_incident ON public.incident_comments USING btree (incident_id);


--
-- Name: idx_incident_comments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_comments_user ON public.incident_comments USING btree (user_id);


--
-- Name: idx_incident_timeline_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_timeline_created ON public.incident_timeline USING btree (created_at);


--
-- Name: idx_incident_timeline_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_timeline_event_type ON public.incident_timeline USING btree (event_type);


--
-- Name: idx_incident_timeline_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incident_timeline_incident ON public.incident_timeline USING btree (incident_id);


--
-- Name: idx_incidents_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_category ON public.incidents USING btree (category);


--
-- Name: idx_incidents_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_location ON public.incidents USING gist (location);


--
-- Name: idx_incidents_severity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_severity ON public.incidents USING btree (severity);


--
-- Name: idx_incidents_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_incidents_status ON public.incidents USING btree (status);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree (created_at);


--
-- Name: idx_notifications_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_incident ON public.notifications USING btree (incident_id);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_organizations_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_status ON public.organizations USING btree (status);


--
-- Name: idx_organizations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_organizations_type ON public.organizations USING btree (type);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_resource_requests_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_requests_incident ON public.resource_requests USING btree (incident_id);


--
-- Name: idx_resource_requests_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_requests_priority ON public.resource_requests USING btree (priority);


--
-- Name: idx_resource_requests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_requests_status ON public.resource_requests USING btree (status);


--
-- Name: idx_sos_reports_incident_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sos_reports_incident_id ON public.sos_reports USING btree (incident_id);


--
-- Name: idx_volunteer_assignments_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_assignments_incident ON public.volunteer_assignments USING btree (incident_id);


--
-- Name: idx_volunteer_assignments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_assignments_status ON public.volunteer_assignments USING btree (status);


--
-- Name: idx_volunteer_assignments_volunteer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_volunteer_assignments_volunteer ON public.volunteer_assignments USING btree (volunteer_id);


--
-- Name: uq_active_volunteer_incident; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_active_volunteer_incident ON public.volunteer_assignments USING btree (volunteer_id, incident_id) WHERE ((status)::text <> 'CANCELLED'::text);


--
-- Name: ai_analysis ai_analysis_incident_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_incident_id_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: assignments assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: assignments assignments_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id);


--
-- Name: assignments assignments_sos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_sos_id_fkey FOREIGN KEY (sos_id) REFERENCES public.sos_reports(id);


--
-- Name: assignments assignments_volunteer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_volunteer_id_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id);


--
-- Name: incidents fk_incident_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT fk_incident_created_by FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: incidents fk_incident_verified_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incidents
    ADD CONSTRAINT fk_incident_verified_by FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: sos_reports fk_sos_reports_incident; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sos_reports
    ADD CONSTRAINT fk_sos_reports_incident FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: users fk_users_organization; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: incident_comments incident_comments_incident_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_incident_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: incident_comments incident_comments_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_comments
    ADD CONSTRAINT incident_comments_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: incident_history incident_history_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: incident_history incident_history_sos_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_history
    ADD CONSTRAINT incident_history_sos_id_fkey FOREIGN KEY (sos_id) REFERENCES public.sos_reports(id);


--
-- Name: incident_timeline incident_timeline_incident_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_timeline
    ADD CONSTRAINT incident_timeline_incident_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: incident_timeline incident_timeline_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incident_timeline
    ADD CONSTRAINT incident_timeline_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_incident_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_incident_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resource_requests resource_requests_incident_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_requests
    ADD CONSTRAINT resource_requests_incident_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: resource_requests resource_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_requests
    ADD CONSTRAINT resource_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: resources resources_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_center_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);


--
-- Name: sos_reports sos_alerts_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sos_reports
    ADD CONSTRAINT sos_alerts_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: volunteer_assignments volunteer_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_assignments
    ADD CONSTRAINT volunteer_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: volunteer_assignments volunteer_assignments_incident_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_assignments
    ADD CONSTRAINT volunteer_assignments_incident_fkey FOREIGN KEY (incident_id) REFERENCES public.incidents(id);


--
-- Name: volunteer_assignments volunteer_assignments_volunteer_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_assignments
    ADD CONSTRAINT volunteer_assignments_volunteer_fkey FOREIGN KEY (volunteer_id) REFERENCES public.volunteers(id);


--
-- Name: volunteers volunteers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict nn7oEDXmi2ipF1vh3hOy57rtgSgeloiabVx5BFv3slTuWK52rADcPOs6SUvU7Gk

