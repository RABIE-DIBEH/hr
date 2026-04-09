--
-- PostgreSQL database dump
--

\restrict YtgNkCHhIa19iKNzEIEdWPD2DIN4dLm9ofMKP3Jb0veAOHJgtweo3wjZbckq5j6

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: advance_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.advance_requests (
    advance_id bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    employee_id bigint NOT NULL,
    hr_note character varying(500),
    processed_at timestamp(6) without time zone,
    processed_by bigint,
    reason character varying(500),
    requested_at timestamp(6) without time zone,
    status character varying(20) NOT NULL,
    paid_at timestamp(6) without time zone,
    paid boolean DEFAULT false,
    deducted boolean DEFAULT false,
    salary_month integer,
    salary_year integer
);


ALTER TABLE public.advance_requests OWNER TO postgres;

--
-- Name: advance_requests_advance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.advance_requests_advance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.advance_requests_advance_id_seq OWNER TO postgres;

--
-- Name: advance_requests_advance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.advance_requests_advance_id_seq OWNED BY public.advance_requests.advance_id;


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_records (
    record_id bigint NOT NULL,
    check_in timestamp(6) without time zone,
    check_out timestamp(6) without time zone,
    is_verified_by_manager boolean,
    manager_notes character varying(255),
    status character varying(255),
    verified_at timestamp(6) without time zone,
    work_hours numeric(5,2),
    employee_id bigint NOT NULL,
    manual_adjustment_reason character varying(255),
    manually_adjusted boolean,
    manually_adjusted_at timestamp(6) without time zone,
    manually_adjusted_by bigint,
    payroll_status character varying(255),
    review_status character varying(255)
);


ALTER TABLE public.attendance_records OWNER TO postgres;

--
-- Name: attendance_records_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_records_record_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_records_record_id_seq OWNER TO postgres;

--
-- Name: attendance_records_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_records_record_id_seq OWNED BY public.attendance_records.record_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id bigint NOT NULL,
    department_name character varying(100) NOT NULL,
    department_code character varying(20),
    manager_id bigint,
    description character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    employee_id bigint NOT NULL,
    base_salary numeric(12,2),
    created_at timestamp(6) without time zone,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    manager_id bigint,
    password_hash character varying(255) NOT NULL,
    role_id bigint,
    status character varying(255),
    team_id bigint,
    leave_balance_days double precision,
    overtime_balance_hours double precision,
    address character varying(255),
    mobile_number character varying(255),
    national_id character varying(255),
    avatar_url character varying(255),
    department_id bigint
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_employee_id_seq OWNER TO postgres;

--
-- Name: employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_employee_id_seq OWNED BY public.employees.employee_id;


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO postgres;

--
-- Name: inbox_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inbox_messages (
    message_id bigint NOT NULL,
    archived boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    message text NOT NULL,
    priority character varying(255) NOT NULL,
    read_at timestamp(6) without time zone,
    sender_name character varying(255) NOT NULL,
    target_role character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    target_employee_id bigint,
    reply_to bigint,
    sender_employee_id bigint
);


ALTER TABLE public.inbox_messages OWNER TO postgres;

--
-- Name: inbox_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.inbox_messages_message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inbox_messages_message_id_seq OWNER TO postgres;

--
-- Name: inbox_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.inbox_messages_message_id_seq OWNED BY public.inbox_messages.message_id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    request_id bigint NOT NULL,
    end_date date NOT NULL,
    leave_type character varying(255) NOT NULL,
    manager_note character varying(255),
    processed_at timestamp(6) without time zone,
    requested_at timestamp(6) without time zone,
    start_date date NOT NULL,
    status character varying(255),
    employee_id bigint NOT NULL,
    duration double precision NOT NULL,
    reason character varying(500)
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_request_id_seq OWNER TO postgres;

--
-- Name: leave_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_request_id_seq OWNED BY public.leave_requests.request_id;


--
-- Name: nfc_cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nfc_cards (
    card_id bigint NOT NULL,
    issued_date timestamp(6) without time zone,
    status character varying(255),
    uid character varying(255) NOT NULL,
    employee_id bigint NOT NULL
);


ALTER TABLE public.nfc_cards OWNER TO postgres;

--
-- Name: nfc_cards_card_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nfc_cards_card_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nfc_cards_card_id_seq OWNER TO postgres;

--
-- Name: nfc_cards_card_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nfc_cards_card_id_seq OWNED BY public.nfc_cards.card_id;


--
-- Name: nfc_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nfc_devices (
    device_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    system_load character varying(255)
);


ALTER TABLE public.nfc_devices OWNER TO postgres;

--
-- Name: payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll (
    payroll_id bigint NOT NULL,
    deductions numeric(10,2),
    generated_at timestamp(6) without time zone,
    month integer NOT NULL,
    net_salary numeric(12,2),
    overtime_hours numeric(10,2),
    total_work_hours numeric(10,2),
    year integer NOT NULL,
    employee_id bigint NOT NULL,
    advance_deductions numeric(12,2),
    paid_at timestamp(6) without time zone,
    paid boolean
);


ALTER TABLE public.payroll OWNER TO postgres;

--
-- Name: payroll_payroll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_payroll_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payroll_payroll_id_seq OWNER TO postgres;

--
-- Name: payroll_payroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_payroll_id_seq OWNED BY public.payroll.payroll_id;


--
-- Name: recruitment_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_requests (
    request_id bigint NOT NULL,
    address character varying(500) NOT NULL,
    age integer NOT NULL,
    approved_by bigint,
    department character varying(100) NOT NULL,
    expected_salary numeric(12,2) NOT NULL,
    full_name character varying(200) NOT NULL,
    health_number character varying(50),
    insurance_number character varying(50),
    job_description character varying(300) NOT NULL,
    manager_note character varying(500),
    marital_status character varying(20) NOT NULL,
    military_service_status character varying(50) NOT NULL,
    mobile_number character varying(20) NOT NULL,
    national_id character varying(50) NOT NULL,
    number_of_children integer,
    processed_at timestamp(6) without time zone,
    requested_at timestamp(6) without time zone,
    requested_by bigint NOT NULL,
    status character varying(20) NOT NULL,
    email character varying(200) NOT NULL,
    auto_generate_employee_id boolean,
    employee_id bigint
);


ALTER TABLE public.recruitment_requests OWNER TO postgres;

--
-- Name: recruitment_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_requests_request_id_seq OWNER TO postgres;

--
-- Name: recruitment_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_requests_request_id_seq OWNED BY public.recruitment_requests.request_id;


--
-- Name: system_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_logs (
    log_id bigint NOT NULL,
    action character varying(255) NOT NULL,
    origin_user character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    "timestamp" timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.system_logs OWNER TO postgres;

--
-- Name: system_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_logs_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_logs_log_id_seq OWNER TO postgres;

--
-- Name: system_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_logs_log_id_seq OWNED BY public.system_logs.log_id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    team_id bigint NOT NULL,
    manager_id bigint,
    name character varying(255) NOT NULL
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- Name: teams_team_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teams_team_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teams_team_id_seq OWNER TO postgres;

--
-- Name: teams_team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teams_team_id_seq OWNED BY public.teams.team_id;


--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_roles (
    role_id bigint NOT NULL,
    role_name character varying(255) NOT NULL
);


ALTER TABLE public.users_roles OWNER TO postgres;

--
-- Name: users_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_roles_role_id_seq OWNER TO postgres;

--
-- Name: users_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_roles_role_id_seq OWNED BY public.users_roles.role_id;


--
-- Name: advance_requests advance_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advance_requests ALTER COLUMN advance_id SET DEFAULT nextval('public.advance_requests_advance_id_seq'::regclass);


--
-- Name: attendance_records record_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN record_id SET DEFAULT nextval('public.attendance_records_record_id_seq'::regclass);


--
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- Name: employees employee_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN employee_id SET DEFAULT nextval('public.employees_employee_id_seq'::regclass);


--
-- Name: inbox_messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_messages ALTER COLUMN message_id SET DEFAULT nextval('public.inbox_messages_message_id_seq'::regclass);


--
-- Name: leave_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN request_id SET DEFAULT nextval('public.leave_requests_request_id_seq'::regclass);


--
-- Name: nfc_cards card_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfc_cards ALTER COLUMN card_id SET DEFAULT nextval('public.nfc_cards_card_id_seq'::regclass);


--
-- Name: payroll payroll_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll ALTER COLUMN payroll_id SET DEFAULT nextval('public.payroll_payroll_id_seq'::regclass);


--
-- Name: recruitment_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests ALTER COLUMN request_id SET DEFAULT nextval('public.recruitment_requests_request_id_seq'::regclass);


--
-- Name: system_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs ALTER COLUMN log_id SET DEFAULT nextval('public.system_logs_log_id_seq'::regclass);


--
-- Name: teams team_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams ALTER COLUMN team_id SET DEFAULT nextval('public.teams_team_id_seq'::regclass);


--
-- Name: users_roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles ALTER COLUMN role_id SET DEFAULT nextval('public.users_roles_role_id_seq'::regclass);


--
-- Data for Name: advance_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.advance_requests (advance_id, amount, employee_id, hr_note, processed_at, processed_by, reason, requested_at, status, paid_at, paid, deducted, salary_month, salary_year) FROM stdin;
1	123.00	1	\N	2026-04-04 23:11:24.195596	2	sdf	2026-04-04 00:22:47.608566	Rejected	\N	f	f	\N	\N
2	123.00	1	\N	2026-04-04 23:11:25.651714	2	sdft	2026-04-04 23:08:07.218374	Rejected	\N	f	f	\N	\N
3	123.00	1	\N	2026-04-04 23:50:31.964247	2	dfsdf	2026-04-04 23:22:18.200771	Rejected	\N	f	f	\N	\N
4	123.00	1	\N	2026-04-04 23:57:36.893253	2	sdfsdfsdf	2026-04-04 23:57:17.347229	Rejected	\N	f	f	\N	\N
5	123.00	1	\N	2026-04-05 00:02:51.551804	2	sdf	2026-04-05 00:02:34.273375	Rejected	\N	f	f	\N	\N
6	123.00	1	\N	2026-04-05 00:14:06.017551	2	erwerf	2026-04-05 00:13:29.15461	Rejected	\N	f	f	\N	\N
7	123.00	1	\N	2026-04-05 00:14:07.516056	2	sdfsdfsdfdgfgfgf	2026-04-05 00:13:49.276212	Approved	\N	f	f	\N	\N
8	333.00	1	\N	2026-04-05 00:16:31.365313	2	sdggbtgb	2026-04-05 00:15:21.707795	Approved	\N	f	f	\N	\N
9	222.00	1	\N	2026-04-05 01:41:25.02282	2	sdfsdfsdf	2026-04-05 00:44:30.972964	Rejected	\N	f	f	\N	\N
10	123.00	1	\N	2026-04-05 01:41:27.501113	2	hello	2026-04-05 01:08:29.441474	Approved	\N	f	f	\N	\N
11	123.00	1	\N	2026-04-05 01:41:29.756522	2	ERWER	2026-04-05 01:40:16.013798	Rejected	\N	f	f	\N	\N
12	222.00	5	\N	2026-04-05 01:41:31.03698	2	slfaaaaa	2026-04-05 01:40:54.510551	Approved	\N	f	f	\N	\N
14	123.00	1	\N	2026-04-07 00:37:02.142264	6	wewerw	2026-04-07 00:31:40.885708	DELIVERED	2026-04-07 00:37:06.205469	t	t	4	2026
13	222.00	1	\N	2026-04-07 00:30:25.536998	1	dfgfdg	2026-04-07 00:08:56.032967	DELIVERED	2026-04-07 00:30:33.745337	t	t	4	2026
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_records (record_id, check_in, check_out, is_verified_by_manager, manager_notes, status, verified_at, work_hours, employee_id, manual_adjustment_reason, manually_adjusted, manually_adjusted_at, manually_adjusted_by, payroll_status, review_status) FROM stdin;
1	2026-04-01 08:00:00	2026-04-01 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
2	2026-04-02 08:15:00	2026-04-02 16:45:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
3	2026-04-03 07:50:00	2026-04-03 16:00:00	t	\N	Normal	\N	8.17	5	\N	\N	\N	\N	\N	\N
4	2026-04-04 08:30:00	2026-04-04 17:00:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
5	2026-04-05 08:00:00	2026-04-05 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
8	2026-04-08 08:05:00	2026-04-08 16:35:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
9	2026-04-09 08:00:00	2026-04-09 16:00:00	t	\N	Normal	\N	8.00	5	\N	\N	\N	\N	\N	\N
10	2026-04-10 08:20:00	2026-04-10 16:50:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
11	2026-04-11 08:00:00	2026-04-11 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
12	2026-04-12 08:00:00	2026-04-12 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
13	2026-04-13 08:00:00	2026-04-13 18:00:00	t	\N	Normal	\N	10.00	5	\N	\N	\N	\N	\N	\N
14	2026-04-14 08:00:00	2026-04-14 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
15	2026-04-15 08:00:00	2026-04-15 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
16	2026-04-16 08:00:00	2026-04-16 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
17	2026-04-17 08:00:00	2026-04-17 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
18	2026-04-18 08:00:00	2026-04-18 16:30:00	t	\N	Normal	\N	8.50	5	\N	\N	\N	\N	\N	\N
19	2026-04-19 08:00:00	2026-04-19 16:30:00	t	ماهو موجود	Fraud	2026-04-06 19:16:30.188974	0.00	5	\N	\N	\N	\N	EXCLUDED_FROM_PAYROLL	FRAUD
6	2026-04-06 08:10:00	2026-04-06 16:40:00	t	Suspicious activity reported by manager	Verified	2026-04-06 18:50:28.688253	8.50	5	\N	\N	\N	\N	PROCESSED	VERIFIED
20	2026-04-20 08:00:00	2026-04-20 16:30:00	t	Suspicious activity reported by manager	Verified	2026-04-06 19:16:14.233531	8.50	5	\N	\N	\N	\N	PROCESSED	VERIFIED
7	2026-04-07 08:00:00	2026-04-07 17:30:00	t	ks ema	Fraud	2026-04-07 00:05:27.257366	0.00	5	\N	\N	\N	\N	EXCLUDED_FROM_PAYROLL	FRAUD
21	2026-04-06 04:39:13.336091	2026-04-08 02:48:58.430442	t	Suspicious activity reported by manager	Verified	2026-04-06 04:40:51.647068	46.16	5	\N	f	\N	\N	PROCESSED	VERIFIED
22	2026-04-08 14:56:27.865944	\N	f	\N	Normal	\N	\N	5	\N	f	\N	\N	PENDING_APPROVAL	PENDING_REVIEW
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, department_name, department_code, manager_id, description, created_at) FROM stdin;
1	Engineering	ENG	\N	Software development and technical operations	2026-04-08 17:33:39.266906
2	Human Resources	HR	\N	People operations and talent management	2026-04-08 17:33:39.268055
3	Finance	FIN	\N	Financial planning and accounting	2026-04-08 17:33:39.269103
6	General	GEN	\N	Default department for existing employees	2026-04-08 17:33:39.271785
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (employee_id, base_salary, created_at, email, full_name, manager_id, password_hash, role_id, status, team_id, leave_balance_days, overtime_balance_hours, address, mobile_number, national_id, avatar_url, department_id) FROM stdin;
2	15000.00	\N	admin@hrms.com	System Admin	\N	$2a$10$6SMniN9blG7wWSU43EuLnuaey.OEkHETPQYz.No/VOGf9x58kLieG	1	Active	\N	\N	\N	\N	\N	\N	\N	6
5	5000.00	\N	employee@hrms.com	Lina Employee	4	$2a$10$jy0CFY5cxzCUxC83Piqkp.3.gxuRav9Du9Cbdgf6TrDVOCgJ4ICUy	4	Active	1	\N	-4	walthausen	\N	\N	\N	6
4	12000.00	\N	manager@hrms.com	Khalid Manager	\N	$2a$10$BdsR0h2gngrvXRm50QujSOyFjVejqrI6wxBRge7Nb0.3Dx.1iS/a2	3	Active	1	\N	\N	hello	\N	\N	\N	6
3	9000.00	\N	hr@hrms.com	Sara HR	\N	$2a$10$Kms7UuK2oTmGrLzPOhUZo./fjiktvR9TOg2a.eZuCO0ezN5wMAzn6	2	Active	\N	\N	\N	\N	\N	\N	\N	2
6	8500.00	2026-04-05 00:23:08.315914	payroll@hrms.com	Ahmad Payroll	\N	$2a$10$hnBq07cfJtYZHH6/bUobJOMJSrovwhRAAhp/cE6jszGufiU5jhMsG	121	Active	\N	21	0	\N	\N	\N	\N	3
1	20000.00	\N	dev@hrms.com	Dev Super Admin	\N	$2a$10$3h3D8LHZ7RpFe2qUz5At3eyMAJ79rw15hxhmmHfeFnkJ5DVTQm0rW	5	Active	\N	-7	\N	hameln	\N	\N	\N	1
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	0	<< Flyway Baseline >>	BASELINE	<< Flyway Baseline >>	\N	postgres	2026-04-06 14:35:29.281855	0	t
\.


--
-- Data for Name: inbox_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inbox_messages (message_id, archived, created_at, message, priority, read_at, sender_name, target_role, title, target_employee_id, reply_to, sender_employee_id) FROM stdin;
57	f	2026-04-06 18:46:01.718572	Employee Dev Super Admin (who has no manager) has submitted a leave request. It is now awaiting HR approval.	MEDIUM	2026-04-06 18:52:22.887137	System	HR	New Leave Request (No Manager assigned)	\N	\N	\N
59	f	2026-04-07 00:08:56.047283	A new advance request of 222 has been submitted and is pending review.	MEDIUM	\N	System	HR	New Advance Request	\N	\N	\N
63	f	2026-04-07 00:31:40.888769	A new advance request of 123 has been submitted and is pending review.	MEDIUM	\N	System	MANAGER	New Advance Request	\N	\N	\N
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (request_id, end_date, leave_type, manager_note, processed_at, requested_at, start_date, status, employee_id, duration, reason) FROM stdin;
8	2026-04-12	Standard	\N	2026-04-06 03:17:56.820925	2026-04-06 02:56:18.164827	2026-04-07	REJECTED	5	4	123
7	2026-04-12	Standard	\N	2026-04-06 03:17:58.549117	2026-04-06 02:53:43.262614	2026-04-09	REJECTED	1	3	123
5	2026-04-12	Standard	\N	2026-04-06 03:18:00.103399	2026-04-06 02:41:57.020832	2026-04-08	REJECTED	1	4	123
3	2026-04-12	Standard	\N	2026-04-06 03:18:02.098618	2026-04-06 02:25:05.589386	2026-04-08	REJECTED	1	12	sdfsdf
2	2026-05-01	Standard	\N	2026-04-06 03:18:03.754217	2026-04-05 00:16:10.461356	2026-04-06	REJECTED	5	12	asdasdas
1	2026-04-24	Standard	\N	2026-04-06 03:18:05.127283	2026-04-04 00:21:13.266352	2026-04-09	REJECTED	1	12	df
4	2026-04-10	Standard	\N	2026-04-06 03:18:06.657245	2026-04-06 02:36:39.599829	2026-04-07	REJECTED	1	2	123
6	2026-04-11	Standard	\N	2026-04-06 03:18:08.215574	2026-04-06 02:46:10.228322	2026-04-08	REJECTED	1	3	123
9	2026-04-10	Standard	\N	2026-04-06 03:20:06.681853	2026-04-06 03:18:48.097461	2026-04-07	APPROVED	1	3	fff
10	2026-04-07	Hourly	\N	2026-04-06 03:26:49.756489	2026-04-06 03:25:27.065924	2026-04-07	APPROVED	5	2	124455
11	2026-04-08	Hourly	\N	2026-04-06 03:49:13.300268	2026-04-06 03:48:55.923624	2026-04-08	APPROVED	5	2	fghdf
12	2026-04-11	Standard	\N	2026-04-06 03:55:42.085408	2026-04-06 03:55:24.704767	2026-04-07	APPROVED	1	4	i need it
13	2026-04-22	Hourly	\N	2026-04-06 18:52:18.47364	2026-04-06 18:46:01.709265	2026-04-22	REJECTED	1	2	sdfdfdfdfd
\.


--
-- Data for Name: nfc_cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nfc_cards (card_id, issued_date, status, uid, employee_id) FROM stdin;
1	\N	Active	TEST-NFC-UID-0001	5
2	2026-04-06 19:11:10.32484	Active	0004	4
\.


--
-- Data for Name: nfc_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nfc_devices (device_id, name, status, system_load) FROM stdin;
NFC-T1	Main Gate Terminal	Online	12%
NFC-T2	IT Dept Terminal	Offline	0%
NFC-T3	HR Dept Terminal	Online	5%
\.


--
-- Data for Name: payroll; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll (payroll_id, deductions, generated_at, month, net_salary, overtime_hours, total_work_hours, year, employee_id, advance_deductions, paid_at, paid) FROM stdin;
7	0.00	2026-04-05 02:51:44.872202	5	0.00	0.00	0.00	2026	5	0.00	\N	\N
5	0.00	2026-04-05 02:51:09.379276	4	0.00	0.00	0.00	2026	6	0.00	2026-04-07 01:00:27.808623	t
1	0.00	2026-04-05 02:50:28.96552	4	0.00	0.00	0.00	2026	1	0.00	2026-04-07 01:00:27.808634	t
3	0.00	2026-04-05 02:50:47.28401	4	0.00	0.00	0.00	2026	4	0.00	2026-04-07 01:00:27.808637	t
2	0.00	2026-04-05 02:50:36.807775	4	531.25	0.00	17.00	2026	5	0.00	2026-04-07 01:00:27.808639	t
4	0.00	2026-04-05 02:51:06.501944	4	0.00	0.00	0.00	2026	3	0.00	2026-04-07 01:00:27.80864	t
6	0.00	2026-04-05 02:51:12.438262	4	0.00	0.00	0.00	2026	2	0.00	2026-04-07 01:00:27.808642	t
\.


--
-- Data for Name: recruitment_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruitment_requests (request_id, address, age, approved_by, department, expected_salary, full_name, health_number, insurance_number, job_description, manager_note, marital_status, military_service_status, mobile_number, national_id, number_of_children, processed_at, requested_at, requested_by, status, email, auto_generate_employee_id, employee_id) FROM stdin;
1	Walthausenstraße 25	22	3	sdfsdf	123.00	Abdulkarim Bashir Termanini	455454	123132df	sdfsdfs	\N	أعزب	أدى الخدمة	0512345678	1231231231	32	2026-04-05 02:29:55.664289	2026-04-05 02:16:30.836012	3	REJECTED	bashirtermaniniabdulkarim@mailfence.com	\N	\N
2	Walthausenstraße 25	22	4	sdfsdf	123.00	Abdulkarim Bashir Termanini	051234567	123132df	sdfsdfs	\N	أعزب	أدى الخدمة	0560400540	1234567890	2	2026-04-05 02:31:47.265866	2026-04-05 02:30:57.549145	3	REJECTED	bashirtermaniniabdulkarim@mailfence.com	\N	\N
9	Walthausenstraße 25	22	3	sdfsdf	123.00	ka m Termanini	455454	123132df	sdfsdfs	\N	أعزب	أدى الخدمة	0560400540	1234267890	2	2026-04-05 02:36:26.285413	2026-04-05 02:35:48.181946	3	REJECTED	bashirtermaniniabdulkarim@mailfence.com	\N	\N
10	Walthausenstraße 25	22	3	sdfsdf	123.00	Abdulkarim Bashir Termanini	455454	123132df	sdfsdfs	\N	أعزب	أدى الخدمة	0560400540	1234567890	2	2026-04-05 02:42:22.736239	2026-04-05 02:42:15.319955	3	REJECTED	bashirtermaniniabdulkarim@mailfence.com	\N	\N
11	Walthausenstraße 25	22	3	sdfsdf	123.00	Abdulkarim mh Termanini	425454	123134df	sdfsdfs	\N	أعزب	أدى الخدمة	0590400540	1234547890	2	2026-04-05 15:43:48.390611	2026-04-05 15:42:37.058779	3	REJECTED	bashirtermaniniabdulkarim@mailfence.com	\N	\N
\.


--
-- Data for Name: system_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_logs (log_id, action, origin_user, status, "timestamp") FROM stdin;
416	Clear Audit Logs	Admin	Success	2026-04-06 19:20:57.489887
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teams (team_id, manager_id, name) FROM stdin;
1	\N	Engineering
2	\N	Marketing
3	\N	Sales
73	\N	Finance
\.


--
-- Data for Name: users_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_roles (role_id, role_name) FROM stdin;
1	ADMIN
2	HR
3	MANAGER
4	EMPLOYEE
5	SUPER_ADMIN
121	PAYROLL
\.


--
-- Name: advance_requests_advance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.advance_requests_advance_id_seq', 14, true);


--
-- Name: attendance_records_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_records_record_id_seq', 22, true);


--
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 6, true);


--
-- Name: employees_employee_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_employee_id_seq', 6, true);


--
-- Name: inbox_messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.inbox_messages_message_id_seq', 66, true);


--
-- Name: leave_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_request_id_seq', 13, true);


--
-- Name: nfc_cards_card_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nfc_cards_card_id_seq', 2, true);


--
-- Name: payroll_payroll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_payroll_id_seq', 7, true);


--
-- Name: recruitment_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruitment_requests_request_id_seq', 11, true);


--
-- Name: system_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_logs_log_id_seq', 416, true);


--
-- Name: teams_team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teams_team_id_seq', 400, true);


--
-- Name: users_roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_roles_role_id_seq', 666, true);


--
-- Name: advance_requests advance_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.advance_requests
    ADD CONSTRAINT advance_requests_pkey PRIMARY KEY (advance_id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (record_id);


--
-- Name: departments departments_department_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_code_key UNIQUE (department_code);


--
-- Name: departments departments_department_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_name_key UNIQUE (department_name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: inbox_messages inbox_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbox_messages
    ADD CONSTRAINT inbox_messages_pkey PRIMARY KEY (message_id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (request_id);


--
-- Name: nfc_cards nfc_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfc_cards
    ADD CONSTRAINT nfc_cards_pkey PRIMARY KEY (card_id);


--
-- Name: nfc_devices nfc_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfc_devices
    ADD CONSTRAINT nfc_devices_pkey PRIMARY KEY (device_id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (payroll_id);


--
-- Name: recruitment_requests recruitment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_requests
    ADD CONSTRAINT recruitment_requests_pkey PRIMARY KEY (request_id);


--
-- Name: system_logs system_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_logs
    ADD CONSTRAINT system_logs_pkey PRIMARY KEY (log_id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (team_id);


--
-- Name: nfc_cards uk_90tlslya17ft0qlbaevwwt6io; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfc_cards
    ADD CONSTRAINT uk_90tlslya17ft0qlbaevwwt6io UNIQUE (employee_id);


--
-- Name: teams uk_a510no6sjwqcx153yd5sm4jrr; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT uk_a510no6sjwqcx153yd5sm4jrr UNIQUE (name);


--
-- Name: nfc_cards uk_b4v9e52cjut37yw3l0l2r9yke; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfc_cards
    ADD CONSTRAINT uk_b4v9e52cjut37yw3l0l2r9yke UNIQUE (uid);


--
-- Name: users_roles uk_imnybdqfwb3b39xyr16v2v715; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT uk_imnybdqfwb3b39xyr16v2v715 UNIQUE (role_name);


--
-- Name: employees uk_j9xgmd0ya5jmus09o0b8pqrpb; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT uk_j9xgmd0ya5jmus09o0b8pqrpb UNIQUE (email);


--
-- Name: users_roles users_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_pkey PRIMARY KEY (role_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_created_at ON public.inbox_messages USING btree (created_at);


--
-- Name: idx_target_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_target_employee ON public.inbox_messages USING btree (target_employee_id);


--
-- Name: idx_target_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_target_role ON public.inbox_messages USING btree (target_role);


--
-- Name: departments departments_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(employee_id);


--
-- Name: employees employees_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: nfc_cards fk7ktod706fboggjkmp1o7boty3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nfc_cards
    ADD CONSTRAINT fk7ktod706fboggjkmp1o7boty3 FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: attendance_records fk9i546p78s8xmw82howmttgek8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT fk9i546p78s8xmw82howmttgek8 FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: payroll fko65c0oqf6hr6eka6xtty7ccc; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT fko65c0oqf6hr6eka6xtty7ccc FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: leave_requests fkrxff2xg1kffbjfh5maxwoqyhw; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT fkrxff2xg1kffbjfh5maxwoqyhw FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- PostgreSQL database dump complete
--

\unrestrict YtgNkCHhIa19iKNzEIEdWPD2DIN4dLm9ofMKP3Jb0veAOHJgtweo3wjZbckq5j6

