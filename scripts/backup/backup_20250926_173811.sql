--
-- PostgreSQL database dump
--

\restrict oJNGk6Hck2SqY943DrPCZST7d6yJSwPcOa5ugMNflURKWErJZW9ZdqlilbbigRy

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: test_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO test_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: test_user
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    name character varying(255) NOT NULL,
    name_th character varying(255),
    address text,
    phone character varying(20),
    email character varying(255),
    website character varying(255),
    industry character varying(100),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO test_user;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: test_user
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.companies_id_seq OWNER TO test_user;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test_user
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: internships; Type: TABLE; Schema: public; Owner: test_user
--

CREATE TABLE public.internships (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    student_id integer,
    company_id integer,
    "position" character varying(255) NOT NULL,
    start_date date,
    end_date date,
    status character varying(50) DEFAULT 'pending'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.internships OWNER TO test_user;

--
-- Name: internships_id_seq; Type: SEQUENCE; Schema: public; Owner: test_user
--

CREATE SEQUENCE public.internships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.internships_id_seq OWNER TO test_user;

--
-- Name: internships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test_user
--

ALTER SEQUENCE public.internships_id_seq OWNED BY public.internships.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: test_user
--

CREATE TABLE public.students (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    user_id integer,
    student_id character varying(20) NOT NULL,
    major character varying(100),
    year integer,
    gpa numeric(3,2),
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.students OWNER TO test_user;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: test_user
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.students_id_seq OWNER TO test_user;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test_user
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: test_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(50) DEFAULT 'student'::character varying NOT NULL,
    student_id character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO test_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: test_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO test_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: internships id; Type: DEFAULT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.internships ALTER COLUMN id SET DEFAULT nextval('public.internships_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: test_user
--

COPY public.companies (id, uuid, name, name_th, address, phone, email, website, industry, description, is_active, created_at, updated_at) FROM stdin;
1	948234c7-70d9-4642-b8da-3742b215c80f	Smart Solutions Co., Ltd.	บริษัท สมาร์ท โซลูชั่นส์ จำกัด	123 ถนนเทคโนโลยี กรุงเทพฯ 10400	02-123-4567	hr@smart-solutions.com	https://smart-solutions.com	Software Development	บริษัทพัฒนาซอฟต์แวร์และเทคโนโลยี	t	2025-09-26 07:16:34.548096	2025-09-26 07:16:34.548096
2	cbea523c-cb3e-4a5d-bb72-99df9359a132	Tech Innovation Ltd.	บริษัท เทค อินโนเวชั่น จำกัด	456 ถนนนวัตกรรม กรุงเทพฯ 10110	02-234-5678	contact@techinnovation.co.th	https://techinnovation.co.th	Technology	บริษัทเทคโนโลยีและนวัตกรรม	t	2025-09-26 07:16:34.548096	2025-09-26 07:16:34.548096
3	7907edde-21b1-4dfe-9bfd-dc3f54c228e4	Digital Future Corp.	บริษัท ดิจิทัล ฟิวเจอร์ จำกัด	789 ถนนอนาคต กรุงเทพฯ 10330	02-345-6789	info@digitalfuture.com	https://digitalfuture.com	Digital Services	บริษัทให้บริการดิจิทัล	t	2025-09-26 07:16:34.548096	2025-09-26 07:16:34.548096
\.


--
-- Data for Name: internships; Type: TABLE DATA; Schema: public; Owner: test_user
--

COPY public.internships (id, uuid, student_id, company_id, "position", start_date, end_date, status, description, created_at, updated_at) FROM stdin;
1	837434ab-6583-4a93-87a6-6f0f3897be2b	1	1	Frontend Developer Intern	2024-06-01	2024-08-31	approved	ฝึกงานด้านการพัฒนา Frontend ด้วย React และ Next.js	2025-09-26 07:16:34.555093	2025-09-26 07:16:34.555093
2	cd88ae35-85fa-46cb-8b6e-0c99985faebc	2	2	Backend Developer Intern	2024-06-15	2024-09-15	in_progress	ฝึกงานด้านการพัฒนา Backend ด้วย Go และ PostgreSQL	2025-09-26 07:16:34.555093	2025-09-26 07:16:34.555093
3	966db79c-392f-4455-aee9-71365a79ae2b	3	3	Full Stack Developer Intern	2024-07-01	2024-09-30	pending	ฝึกงานด้านการพัฒนา Full Stack Application	2025-09-26 07:16:34.555093	2025-09-26 07:16:34.555093
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: test_user
--

COPY public.students (id, uuid, user_id, student_id, major, year, gpa, status, created_at, updated_at) FROM stdin;
1	8ae4bb27-f2c4-46f5-833f-070b13755658	1	6401001	วิทยาการคอมพิวเตอร์	4	3.25	active	2025-09-26 07:16:34.551212	2025-09-26 07:16:34.551212
2	88da3a55-ac87-4620-abe6-e9d37999d512	2	6401002	เทคโนโลยีสารสนเทศ	4	3.50	active	2025-09-26 07:16:34.551212	2025-09-26 07:16:34.551212
3	e41d06c4-0166-400f-b656-a6189f4ebb2b	3	6401003	วิศวกรรมซอฟต์แวร์	3	3.75	active	2025-09-26 07:16:34.551212	2025-09-26 07:16:34.551212
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: test_user
--

COPY public.users (id, uuid, email, password, first_name, last_name, role, student_id, is_active, created_at, updated_at) FROM stdin;
1	667d32d7-8a84-4bc6-901e-8efbbe06fe4e	student1@university.ac.th	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	สมชาย	ใจดี	student	6401001	t	2025-09-26 07:16:34.545473	2025-09-26 07:16:34.545473
2	271f5603-4c27-4d21-9c16-46f42841647f	student2@university.ac.th	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	สมหญิง	รักเรียน	student	6401002	t	2025-09-26 07:16:34.545473	2025-09-26 07:16:34.545473
3	789c6015-ce7e-4065-a932-a075f83bed2b	student3@university.ac.th	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	วิชัย	ขยันเรียน	student	6401003	t	2025-09-26 07:16:34.545473	2025-09-26 07:16:34.545473
4	0a6f76b7-1be0-400d-a5e4-4536cda2f2ca	admin@smart-solutions.com	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	ผู้ดูแล	ระบบ	admin	\N	t	2025-09-26 07:16:34.545473	2025-09-26 07:16:34.545473
5	d5901fbe-1bce-4453-b735-297131f87fe6	instructor@university.ac.th	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	อาจารย์	ที่ปรึกษา	instructor	\N	t	2025-09-26 07:16:34.545473	2025-09-26 07:16:34.545473
\.


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test_user
--

SELECT pg_catalog.setval('public.companies_id_seq', 3, true);


--
-- Name: internships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test_user
--

SELECT pg_catalog.setval('public.internships_id_seq', 3, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test_user
--

SELECT pg_catalog.setval('public.students_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test_user
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: internships internships_pkey; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.internships
    ADD CONSTRAINT internships_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_id_key; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_id_key UNIQUE (student_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_student_id_key; Type: CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_student_id_key UNIQUE (student_id);


--
-- Name: idx_internships_company_id; Type: INDEX; Schema: public; Owner: test_user
--

CREATE INDEX idx_internships_company_id ON public.internships USING btree (company_id);


--
-- Name: idx_internships_student_id; Type: INDEX; Schema: public; Owner: test_user
--

CREATE INDEX idx_internships_student_id ON public.internships USING btree (student_id);


--
-- Name: idx_students_student_id; Type: INDEX; Schema: public; Owner: test_user
--

CREATE INDEX idx_students_student_id ON public.students USING btree (student_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: test_user
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_student_id; Type: INDEX; Schema: public; Owner: test_user
--

CREATE INDEX idx_users_student_id ON public.users USING btree (student_id);


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: test_user
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: internships update_internships_updated_at; Type: TRIGGER; Schema: public; Owner: test_user
--

CREATE TRIGGER update_internships_updated_at BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: students update_students_updated_at; Type: TRIGGER; Schema: public; Owner: test_user
--

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: test_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: internships internships_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.internships
    ADD CONSTRAINT internships_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: internships internships_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.internships
    ADD CONSTRAINT internships_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: test_user
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict oJNGk6Hck2SqY943DrPCZST7d6yJSwPcOa5ugMNflURKWErJZW9ZdqlilbbigRy

