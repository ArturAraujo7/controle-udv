SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict keZhuV1Kf2MFisybEyNcH9zj73C96KeFfKf4iRO5pDKCkBW5jq9vrgCHS6vadeY

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da', 'authenticated', 'authenticated', 'marciodagnoni@hotmail.com', '$2a$10$a3ky6z0S0pBIVQQi229Ef.EuOx2tUNQ.raAIcQiwRmviGRP4ihVYC', '2026-02-03 02:08:21.961396+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-21 21:12:11.216542+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-03 02:08:21.935958+00', '2026-03-22 06:54:08.503621+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', 'authenticated', 'authenticated', 'aurelianochaves9@gmail.com', '$2a$10$kf/ushypNSNoeUgeZj8FM.VnuucleA8eUyRoFM7ILl2MV7mxHqH2i', '2026-02-15 00:51:22.79887+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-15 00:54:39.379258+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-15 00:51:22.774992+00', '2026-03-22 07:06:08.544341+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '410073d0-3d36-4cf7-bc32-0decf57a6562', 'authenticated', 'authenticated', 'secretariageral@dg.udv.org', '$2a$10$kPIb.EH6nqqIGTzXqM3PLeqe9pHnhW5E0OqqXgatuJ0FsI9xuef9O', '2026-02-16 16:11:37.558757+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-18 17:01:33.900319+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-16 16:11:37.531269+00', '2026-02-18 17:01:33.965874+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '73608c46-04c5-40a1-8e37-be7b736c54b9', 'authenticated', 'authenticated', 'cjmoreal@gmail.com', '$2a$10$abfnTjbyg/u8JRPv2oeNiewlFn9RZh6cr.qrQsRHIe/tnbvfARGBy', '2026-03-19 13:03:52.059847+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-19 13:07:14.349412+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-19 13:03:52.031553+00', '2026-03-19 16:19:25.548838+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', 'authenticated', 'authenticated', 'bonazonialan23@gmail.com', '$2a$10$WlNPRKd27QriewjVz6z4YO7ysGo87Tc3FjpXUS62ZMIkd4DdjDZZe', '2026-02-08 21:34:59.552361+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-08 21:36:39.733529+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-08 21:34:59.495217+00', '2026-03-23 02:37:24.417395+00', NULL, NULL, '', '', NULL, '', 0, '2026-04-22 02:37:24.415086+00', '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '055e3331-e041-4eb3-8474-bac35762589a', 'authenticated', 'authenticated', 'arturaraujodasilva16@gmail.com', '$2a$10$H6YXJ9xLOI1yB2Sp5Ldsxe3YK78m/J4e/JrdYngLHC61NvNyxacUW', '2026-02-02 02:07:16.631356+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-22 04:56:21.433297+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-02 02:07:16.583642+00', '2026-03-23 02:47:22.148966+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2bde542d-5c8f-439f-8178-bc1977e2d5a9', 'authenticated', 'authenticated', 'repres.jardimreal@udv.org.br', '$2a$10$e02WS9K5WWpfaBAQgNDnke5t9q6PVfowiAH5ZScBlfmlqdHeBcQKK', '2026-02-02 15:21:02.310216+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-02 16:25:09.340421+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-02 15:21:02.280811+00', '2026-02-04 00:34:07.617429+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', 'authenticated', 'authenticated', 'arturlopes655@gmail.com', '$2a$10$7Ed.S5bP3E5CL8dBWKtJUeDb9HD.kPsHwkJCAO8hCCrqRRYYjbXm.', '2026-02-15 00:50:34.750733+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-02-15 00:50:55.51436+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-02-15 00:50:34.709738+00', '2026-02-25 03:14:51.015159+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '862772cd-2010-4108-aac3-22510f7d5f3a', 'authenticated', 'authenticated', 'lizbsouza32@gmail.com', '$2a$10$IhLddshHlEdn4Q7FdGpDievGKSyMHmWY.yWwEROsPEHb4kkE9i31O', '2026-03-17 14:47:08.506874+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-03-18 16:17:04.923957+00', '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2026-03-17 14:47:08.464019+00', '2026-03-18 16:17:04.939681+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('055e3331-e041-4eb3-8474-bac35762589a', '055e3331-e041-4eb3-8474-bac35762589a', '{"sub": "055e3331-e041-4eb3-8474-bac35762589a", "email": "arturaraujodasilva16@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-02 02:07:16.609695+00', '2026-02-02 02:07:16.610434+00', '2026-02-02 02:07:16.610434+00', 'adf49baa-98aa-4952-8e0e-64fac9094b66'),
	('2bde542d-5c8f-439f-8178-bc1977e2d5a9', '2bde542d-5c8f-439f-8178-bc1977e2d5a9', '{"sub": "2bde542d-5c8f-439f-8178-bc1977e2d5a9", "email": "repres.jardimreal@udv.org.br", "email_verified": false, "phone_verified": false}', 'email', '2026-02-02 15:21:02.301625+00', '2026-02-02 15:21:02.301691+00', '2026-02-02 15:21:02.301691+00', 'ca3b6f0f-c55e-41d9-86b3-60c44f5b7a32'),
	('cdb60f83-bd3b-46bd-9d26-25afc8f811da', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da', '{"sub": "cdb60f83-bd3b-46bd-9d26-25afc8f811da", "email": "marciodagnoni@hotmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-03 02:08:21.958425+00', '2026-02-03 02:08:21.958491+00', '2026-02-03 02:08:21.958491+00', '60f176ae-1888-4f5a-b1d6-05a17d93932b'),
	('6ee005ee-d293-4889-9d5d-9ec44a2c43f7', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', '{"sub": "6ee005ee-d293-4889-9d5d-9ec44a2c43f7", "email": "bonazonialan23@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-08 21:34:59.544442+00', '2026-02-08 21:34:59.54451+00', '2026-02-08 21:34:59.54451+00', '7ec727fb-6464-45e1-b0f9-fb03900cdbb5'),
	('15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', '15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', '{"sub": "15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c", "email": "arturlopes655@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-15 00:50:34.740666+00', '2026-02-15 00:50:34.740721+00', '2026-02-15 00:50:34.740721+00', 'b3849892-2d9c-428b-ab30-29181f82ae77'),
	('ac37ee3f-8c43-412b-9bfa-01678f9cea7a', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', '{"sub": "ac37ee3f-8c43-412b-9bfa-01678f9cea7a", "email": "aurelianochaves9@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-02-15 00:51:22.791589+00', '2026-02-15 00:51:22.791645+00', '2026-02-15 00:51:22.791645+00', 'd0a4c662-0878-4729-9de1-35a67da7e7e9'),
	('410073d0-3d36-4cf7-bc32-0decf57a6562', '410073d0-3d36-4cf7-bc32-0decf57a6562', '{"sub": "410073d0-3d36-4cf7-bc32-0decf57a6562", "email": "secretariageral@dg.udv.org", "email_verified": false, "phone_verified": false}', 'email', '2026-02-16 16:11:37.55188+00', '2026-02-16 16:11:37.551935+00', '2026-02-16 16:11:37.551935+00', '9806cf78-fc59-4ef7-8375-f14fcd600464'),
	('862772cd-2010-4108-aac3-22510f7d5f3a', '862772cd-2010-4108-aac3-22510f7d5f3a', '{"sub": "862772cd-2010-4108-aac3-22510f7d5f3a", "email": "lizbsouza32@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-17 14:47:08.492749+00', '2026-03-17 14:47:08.492806+00', '2026-03-17 14:47:08.492806+00', 'dbeecf17-0586-461c-9b2c-f6bf9502e1a0'),
	('73608c46-04c5-40a1-8e37-be7b736c54b9', '73608c46-04c5-40a1-8e37-be7b736c54b9', '{"sub": "73608c46-04c5-40a1-8e37-be7b736c54b9", "email": "cjmoreal@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-19 13:03:52.051677+00', '2026-03-19 13:03:52.051734+00', '2026-03-19 13:03:52.051734+00', 'b91539e9-a876-402e-8ec8-cc8a5b15ef1e');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('a48c2c0b-51b1-4468-a92f-beff9989833d', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', '2026-02-08 21:36:39.733627+00', '2026-03-22 07:38:29.392421+00', NULL, 'aal1', NULL, '2026-03-22 07:38:29.392302', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', '152.255.94.228', NULL, NULL, NULL, NULL, NULL),
	('afac9aa9-53b9-4923-869a-89365b00866d', '055e3331-e041-4eb3-8474-bac35762589a', '2026-03-21 16:35:52.570231+00', '2026-03-22 18:42:40.909879+00', NULL, 'aal1', NULL, '2026-03-22 18:42:40.909765', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', '201.67.65.231', NULL, NULL, NULL, NULL, NULL),
	('5e0655ca-ec6f-4f59-98f2-6d9c6d901a09', '055e3331-e041-4eb3-8474-bac35762589a', '2026-03-22 04:56:21.433395+00', '2026-03-23 02:47:22.162699+00', NULL, 'aal1', NULL, '2026-03-23 02:47:22.162572', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '201.67.65.231', NULL, NULL, NULL, NULL, NULL),
	('d1bf7aed-b13f-4928-b017-228287ea58ab', '15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', '2026-02-15 00:50:55.517384+00', '2026-02-25 03:14:51.029545+00', NULL, 'aal1', NULL, '2026-02-25 03:14:51.02944', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1', '38.191.56.12', NULL, NULL, NULL, NULL, NULL),
	('21dae237-6f93-48f2-9958-55240f093560', '410073d0-3d36-4cf7-bc32-0decf57a6562', '2026-02-18 17:01:33.900414+00', '2026-02-18 17:01:33.900414+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Brave/1 Mobile/15E148 Safari/604.1', '45.17.217.97', NULL, NULL, NULL, NULL, NULL),
	('e285bf99-a228-4388-a5c6-9dcce8bf8911', '2bde542d-5c8f-439f-8178-bc1977e2d5a9', '2026-02-02 16:25:09.342085+00', '2026-02-04 00:34:07.634561+00', NULL, 'aal1', NULL, '2026-02-04 00:34:07.633358', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36', '179.68.203.164', NULL, NULL, NULL, NULL, NULL),
	('7864f585-f128-41b9-aced-8c7afb81aa27', '862772cd-2010-4108-aac3-22510f7d5f3a', '2026-03-18 16:17:04.92459+00', '2026-03-18 16:17:04.92459+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0', '170.83.172.114', NULL, NULL, NULL, NULL, NULL),
	('3603a344-de5a-4cf1-90c4-e2cc7dbc83e2', '73608c46-04c5-40a1-8e37-be7b736c54b9', '2026-03-19 13:07:14.349508+00', '2026-03-19 16:19:25.565214+00', NULL, 'aal1', NULL, '2026-03-19 16:19:25.562701', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', '179.234.75.114', NULL, NULL, NULL, NULL, NULL),
	('1710c297-d2d0-4a75-ac76-f651570c01b5', '055e3331-e041-4eb3-8474-bac35762589a', '2026-03-21 16:32:36.992027+00', '2026-03-22 04:57:00.621643+00', NULL, 'aal1', NULL, '2026-03-22 04:57:00.621545', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '170.83.175.172', NULL, NULL, NULL, NULL, NULL),
	('f607095d-f8c2-438e-a7a3-0c2986882605', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da', '2026-03-21 21:12:11.217284+00', '2026-03-22 06:54:08.519255+00', NULL, 'aal1', NULL, '2026-03-22 06:54:08.519148', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36', '170.83.175.172', NULL, NULL, NULL, NULL, NULL),
	('e525c437-8bc9-40ba-abb6-a2d9c8407406', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', '2026-02-15 00:54:39.379354+00', '2026-03-22 07:06:08.553205+00', NULL, 'aal1', NULL, '2026-03-22 07:06:08.553065', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', '170.83.175.172', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('e285bf99-a228-4388-a5c6-9dcce8bf8911', '2026-02-02 16:25:09.391734+00', '2026-02-02 16:25:09.391734+00', 'password', '40b772dd-8f9b-43ab-96ba-2f26a47425ec'),
	('a48c2c0b-51b1-4468-a92f-beff9989833d', '2026-02-08 21:36:39.766364+00', '2026-02-08 21:36:39.766364+00', 'password', '4dec320e-fae3-45a8-864b-38ce8457e627'),
	('d1bf7aed-b13f-4928-b017-228287ea58ab', '2026-02-15 00:50:55.592686+00', '2026-02-15 00:50:55.592686+00', 'password', '45fadf0b-e5be-4d0c-a20d-39302acacabc'),
	('e525c437-8bc9-40ba-abb6-a2d9c8407406', '2026-02-15 00:54:39.390279+00', '2026-02-15 00:54:39.390279+00', 'password', '7066df20-41ee-45c9-88d6-8741ecd81a9c'),
	('21dae237-6f93-48f2-9958-55240f093560', '2026-02-18 17:01:33.968817+00', '2026-02-18 17:01:33.968817+00', 'password', 'a82ea99e-e3f8-47aa-a9f1-6778da9fa5ed'),
	('7864f585-f128-41b9-aced-8c7afb81aa27', '2026-03-18 16:17:04.940338+00', '2026-03-18 16:17:04.940338+00', 'password', 'bbfebeeb-55fc-4ef7-9815-9fab25c1b044'),
	('3603a344-de5a-4cf1-90c4-e2cc7dbc83e2', '2026-03-19 13:07:14.362501+00', '2026-03-19 13:07:14.362501+00', 'password', '4d7a5eaf-a8cb-445a-b304-ce8681c84c75'),
	('1710c297-d2d0-4a75-ac76-f651570c01b5', '2026-03-21 16:32:37.021707+00', '2026-03-21 16:32:37.021707+00', 'password', '1b6ab4d1-a7af-43d2-bb9a-27acd0bfb0e1'),
	('afac9aa9-53b9-4923-869a-89365b00866d', '2026-03-21 16:35:52.600249+00', '2026-03-21 16:35:52.600249+00', 'password', 'd819525a-4957-412a-9de6-2759e6a46a4a'),
	('f607095d-f8c2-438e-a7a3-0c2986882605', '2026-03-21 21:12:11.27547+00', '2026-03-21 21:12:11.27547+00', 'password', 'f051b8f9-0971-4e21-b969-66047ccb40f6'),
	('5e0655ca-ec6f-4f59-98f2-6d9c6d901a09', '2026-03-22 04:56:21.505467+00', '2026-03-22 04:56:21.505467+00', 'password', 'e55cec28-f1c8-408f-9365-a63836d37c5b');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 130, 'spegfafyu3nc', '15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', false, '2026-02-25 03:14:51.000224+00', '2026-02-25 03:14:51.000224+00', 'borghywk3z4p', 'd1bf7aed-b13f-4928-b017-228287ea58ab'),
	('00000000-0000-0000-0000-000000000000', 197, 'segsrymq4rk7', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-21 16:32:37.007759+00', '2026-03-21 19:04:02.195216+00', NULL, '1710c297-d2d0-4a75-ac76-f651570c01b5'),
	('00000000-0000-0000-0000-000000000000', 198, 'hsl5y4zka3cv', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-21 16:35:52.583239+00', '2026-03-21 21:13:36.497341+00', NULL, 'afac9aa9-53b9-4923-869a-89365b00866d'),
	('00000000-0000-0000-0000-000000000000', 201, 'ys65g6dsb6vg', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da', true, '2026-03-21 21:12:11.250752+00', '2026-03-22 05:35:00.906458+00', NULL, 'f607095d-f8c2-438e-a7a3-0c2986882605'),
	('00000000-0000-0000-0000-000000000000', 208, 'bbgexd3kqysk', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da', false, '2026-03-22 06:54:08.48939+00', '2026-03-22 06:54:08.48939+00', 'znepdyl5l7e6', 'f607095d-f8c2-438e-a7a3-0c2986882605'),
	('00000000-0000-0000-0000-000000000000', 205, 'dxatnloxx4jl', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-22 05:08:37.36892+00', '2026-03-22 07:25:11.106851+00', 'n22a5iz2kcel', 'afac9aa9-53b9-4923-869a-89365b00866d'),
	('00000000-0000-0000-0000-000000000000', 211, 'i7xnqk4kk2ag', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', false, '2026-03-22 07:38:29.373032+00', '2026-03-22 07:38:29.373032+00', 'auxfmxu4mnl3', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 182, '5o7nwjtntmt2', '862772cd-2010-4108-aac3-22510f7d5f3a', false, '2026-03-18 16:17:04.937656+00', '2026-03-18 16:17:04.937656+00', NULL, '7864f585-f128-41b9-aced-8c7afb81aa27'),
	('00000000-0000-0000-0000-000000000000', 13, 'kslt7gpnqkps', '2bde542d-5c8f-439f-8178-bc1977e2d5a9', true, '2026-02-02 16:25:09.368306+00', '2026-02-04 00:34:07.563543+00', NULL, 'e285bf99-a228-4388-a5c6-9dcce8bf8911'),
	('00000000-0000-0000-0000-000000000000', 29, 'ou6mkt232s52', '2bde542d-5c8f-439f-8178-bc1977e2d5a9', false, '2026-02-04 00:34:07.597477+00', '2026-02-04 00:34:07.597477+00', 'kslt7gpnqkps', 'e285bf99-a228-4388-a5c6-9dcce8bf8911'),
	('00000000-0000-0000-0000-000000000000', 59, 'ercuaqkobb5h', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-08 21:36:39.74523+00', '2026-02-09 03:20:34.12851+00', NULL, 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 82, 'borghywk3z4p', '15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', true, '2026-02-15 00:50:55.560958+00', '2026-02-25 03:14:50.977218+00', NULL, 'd1bf7aed-b13f-4928-b017-228287ea58ab'),
	('00000000-0000-0000-0000-000000000000', 199, 'stml5kna4def', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-21 19:04:02.221855+00', '2026-03-22 04:57:00.608876+00', 'segsrymq4rk7', '1710c297-d2d0-4a75-ac76-f651570c01b5'),
	('00000000-0000-0000-0000-000000000000', 202, 'n22a5iz2kcel', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-21 21:13:36.499869+00', '2026-03-22 05:08:37.352298+00', 'hsl5y4zka3cv', 'afac9aa9-53b9-4923-869a-89365b00866d'),
	('00000000-0000-0000-0000-000000000000', 206, 'znepdyl5l7e6', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da', true, '2026-03-22 05:35:00.934699+00', '2026-03-22 06:54:08.466552+00', 'ys65g6dsb6vg', 'f607095d-f8c2-438e-a7a3-0c2986882605'),
	('00000000-0000-0000-0000-000000000000', 86, 'vzrzbi4twofn', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', true, '2026-02-15 15:04:36.541353+00', '2026-03-22 07:06:08.533176+00', '4dvo3yehqwuv', 'e525c437-8bc9-40ba-abb6-a2d9c8407406'),
	('00000000-0000-0000-0000-000000000000', 64, 'ihug36robtuo', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-09 03:20:34.149006+00', '2026-02-10 16:14:47.748004+00', 'ercuaqkobb5h', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 209, '4aa5khrgerei', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', false, '2026-03-22 07:06:08.538626+00', '2026-03-22 07:06:08.538626+00', 'vzrzbi4twofn', 'e525c437-8bc9-40ba-abb6-a2d9c8407406'),
	('00000000-0000-0000-0000-000000000000', 212, 'cicfjpyjxeel', '055e3331-e041-4eb3-8474-bac35762589a', false, '2026-03-22 18:42:40.870986+00', '2026-03-22 18:42:40.870986+00', 'o5mgx44l5mfy', 'afac9aa9-53b9-4923-869a-89365b00866d'),
	('00000000-0000-0000-0000-000000000000', 186, 'skayiccdbjto', '73608c46-04c5-40a1-8e37-be7b736c54b9', true, '2026-03-19 13:07:14.357751+00', '2026-03-19 16:19:25.495125+00', NULL, '3603a344-de5a-4cf1-90c4-e2cc7dbc83e2'),
	('00000000-0000-0000-0000-000000000000', 69, 'xnrpmhejsvg6', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-10 16:14:47.769078+00', '2026-02-13 11:35:58.499544+00', 'ihug36robtuo', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 83, 'q3j5h7bjm5pn', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', true, '2026-02-15 00:54:39.385079+00', '2026-02-15 02:57:35.642046+00', NULL, 'e525c437-8bc9-40ba-abb6-a2d9c8407406'),
	('00000000-0000-0000-0000-000000000000', 84, '4dvo3yehqwuv', 'ac37ee3f-8c43-412b-9bfa-01678f9cea7a', true, '2026-02-15 02:57:35.671634+00', '2026-02-15 15:04:36.514837+00', 'q3j5h7bjm5pn', 'e525c437-8bc9-40ba-abb6-a2d9c8407406'),
	('00000000-0000-0000-0000-000000000000', 77, '3yc7ceieydoi', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-13 11:35:58.521525+00', '2026-02-15 15:33:24.037501+00', 'xnrpmhejsvg6', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 87, 'p62lhhh4spll', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-15 15:33:24.053168+00', '2026-02-15 20:24:19.007218+00', '3yc7ceieydoi', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 112, '7yduw3yy6lvy', '410073d0-3d36-4cf7-bc32-0decf57a6562', false, '2026-02-18 17:01:33.9419+00', '2026-02-18 17:01:33.9419+00', NULL, '21dae237-6f93-48f2-9958-55240f093560'),
	('00000000-0000-0000-0000-000000000000', 92, 'ukbaujzpdewn', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-15 20:24:19.020263+00', '2026-02-23 02:13:38.63203+00', 'p62lhhh4spll', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 142, 'pbiyrlpccah5', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-03-06 03:56:39.741884+00', '2026-03-21 20:56:29.116235+00', 'ekwuubsmpluv', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 204, 'uygnxuls52ne', '055e3331-e041-4eb3-8474-bac35762589a', false, '2026-03-22 04:57:00.611474+00', '2026-03-22 04:57:00.611474+00', 'stml5kna4def', '1710c297-d2d0-4a75-ac76-f651570c01b5'),
	('00000000-0000-0000-0000-000000000000', 200, 'sxphrazb52py', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-03-21 20:56:29.1392+00', '2026-03-22 06:27:58.411745+00', 'pbiyrlpccah5', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 207, 'auxfmxu4mnl3', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-03-22 06:27:58.420424+00', '2026-03-22 07:38:29.359256+00', 'sxphrazb52py', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 210, 'o5mgx44l5mfy', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-22 07:25:11.118722+00', '2026-03-22 18:42:40.844189+00', 'dxatnloxx4jl', 'afac9aa9-53b9-4923-869a-89365b00866d'),
	('00000000-0000-0000-0000-000000000000', 203, '5txnyjlwfrai', '055e3331-e041-4eb3-8474-bac35762589a', true, '2026-03-22 04:56:21.475335+00', '2026-03-23 02:47:22.10581+00', NULL, '5e0655ca-ec6f-4f59-98f2-6d9c6d901a09'),
	('00000000-0000-0000-0000-000000000000', 213, 'jnf7xneex6dw', '055e3331-e041-4eb3-8474-bac35762589a', false, '2026-03-23 02:47:22.128054+00', '2026-03-23 02:47:22.128054+00', '5txnyjlwfrai', '5e0655ca-ec6f-4f59-98f2-6d9c6d901a09'),
	('00000000-0000-0000-0000-000000000000', 187, 'h3tqfu5ygird', '73608c46-04c5-40a1-8e37-be7b736c54b9', false, '2026-03-19 16:19:25.526498+00', '2026-03-19 16:19:25.526498+00', 'skayiccdbjto', '3603a344-de5a-4cf1-90c4-e2cc7dbc83e2'),
	('00000000-0000-0000-0000-000000000000', 125, 'gghavyf52d56', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-02-23 02:13:38.658265+00', '2026-03-03 17:21:58.111734+00', 'ukbaujzpdewn', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 138, 'k4bzitzey2cr', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-03-03 17:21:58.14297+00', '2026-03-04 16:43:36.199999+00', 'gghavyf52d56', 'a48c2c0b-51b1-4468-a92f-beff9989833d'),
	('00000000-0000-0000-0000-000000000000', 139, 'ekwuubsmpluv', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7', true, '2026-03-04 16:43:36.226726+00', '2026-03-06 03:56:39.712559+00', 'k4bzitzey2cr', 'a48c2c0b-51b1-4468-a92f-beff9989833d');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: preparos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."preparos" ("id", "data_preparo", "mestre_preparo", "quantidade_preparada", "grau", "status", "created_at", "tipo", "data_chegada", "nucleo_origem", "procedencia_mariri", "procedencia_chacrona", "user_id") VALUES
	(1, '2025-11-26', 'Jeniscan', 103.00, 'Tacho da União', 'Disponível', '2026-01-29 20:19:14.917584+00', 'Local', NULL, NULL, '', '', NULL),
	(7, '2025-11-29', 'Jhonatan', 10.50, 'Tacho da União', 'Disponível', '2026-02-02 22:09:00.023024+00', 'Doação', '2025-12-01', 'N. Porto Rico', 'Porto Rico', 'Porto Rico', NULL),
	(4, '2025-09-20', 'Wilton', 131.30, 'Tacho da União', 'Disponível', '2026-02-02 21:06:45.936908+00', 'Local', NULL, NULL, 'Plantio Local', 'Plantio Local', NULL),
	(6, '2025-11-26', 'Aureliano', 31.90, 'Reforço', 'Disponível', '2026-02-02 22:05:01.985684+00', 'Local', NULL, NULL, 'Jardim Real', 'Jardim Real', NULL),
	(9, '2025-05-03', 'Juliano', 2.00, 'Reforço', 'Disponível', '2026-02-08 19:27:13.280811+00', 'Local', NULL, NULL, 'Jardim Real', 'Jardim Real', NULL),
	(10, '2025-11-25', 'Edson', 4.20, 'Reaproveitamento', 'Disponível', '2026-02-08 19:28:06.628664+00', 'Local', NULL, NULL, 'Jardim Real', 'Jardim Real', NULL),
	(11, '2025-08-20', 'Vanio', 53.20, 'Reforço', 'Disponível', '2026-02-08 19:33:20.542576+00', 'Doação', '2025-08-20', 'N. Belo Reinado', 'Plantio Local', 'Plantio Local', NULL),
	(8, '2025-11-29', 'Juarez', 10.50, 'Tacho da União', 'Disponível', '2026-02-02 22:14:58.637893+00', 'Doação', '2025-12-10', 'N. Belo Jardim', 'Belo Jardim', 'Belo Jardim', NULL),
	(12, '2025-12-30', 'Jeniscan', 4.20, 'Tacho da União ', 'Disponível', '2026-02-13 01:54:33.50075+00', 'Doação', '2026-02-10', 'Núcleo João Lango Moura ', 'Ramal do Boi', 'Local', NULL),
	(14, '2026-03-12', 'Adriano', 31.00, 'Apuro', 'Disponível', '2026-03-13 21:46:09.276235+00', 'Local', NULL, NULL, 'Núcleo Jardim Real ', 'Núcleo Jardim Real ', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da');


--
-- Data for Name: sessoes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sessoes" ("id", "data_realizacao", "tipo", "dirigente", "explanador", "quantidade_participantes", "id_preparo", "quantidade_consumida", "created_at", "leitor_documentos", "user_id") VALUES
	(43, '2024-03-02 20:00:00+00', 'Escala', 'C. Franciélia', 'Laraliz Mota', 0, NULL, 0.00, '2026-03-17 15:17:12.273207+00', 'Ana Beatriz Moreal', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(45, '2024-03-16 20:00:00+00', 'Escala', 'M. Jaques Douglas/M. Dionatas', 'C. Nonato', 0, NULL, 0.00, '2026-03-17 15:19:44.59006+00', 'Jean Freire', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(16, '2025-12-06 20:00:00+00', 'Escala', 'C. Moura', 'Matteuz Luz', 100, 1, 9.90, '2026-02-02 22:18:15.949422+00', 'Ana Beatriz Barros', NULL),
	(17, '2025-12-07 12:00:00+00', 'Instrutiva', 'M. Aureliano', '', 70, 1, 6.00, '2026-02-02 22:19:18.483886+00', '', NULL),
	(19, '2025-12-20 20:00:00+00', 'Escala', 'C. Marcos', 'C. Denis', 90, 1, 8.00, '2026-02-02 22:21:42.317659+00', 'C. Marcia Moreal', NULL),
	(46, '2024-03-27 20:00:00+00', 'Escala Anual', 'M. Darílio ', 'Hilberto', 0, NULL, 0.00, '2026-03-17 15:21:47.904455+00', 'Patrícia Malavazzi', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(23, '2026-01-17 20:00:00+00', 'Escala', 'M. Juliano / M. Marcio', 'C. Marcia Moreal', 90, 1, 8.50, '2026-02-02 22:28:07.70656+00', 'Jessica Liz', NULL),
	(47, '2024-04-01 20:00:00+00', 'Quadro de Mestres', 'M. Jeniscan', '', 0, NULL, 0.00, '2026-03-17 15:23:16.635782+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(21, '2025-12-31 15:00:00+00', 'Extra', 'M. Darílio', '', 150, 1, 13.55, '2026-02-02 22:25:34.249746+00', '', NULL),
	(49, '2024-04-13 20:00:00+00', 'Extra', 'M. Neto', '', 0, NULL, 0.00, '2026-03-17 15:25:49.78075+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(51, '2024-04-27 20:00:00+00', 'Quadro de Mestres', 'M. Roberto Souto', '', 0, NULL, 0.00, '2026-03-17 15:27:39.856264+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(22, '2026-01-06 20:00:00+00', 'Escala Anual', 'M. Edson', 'Alan Bonazoni', 90, 8, 8.40, '2026-02-02 22:26:42.388669+00', 'Juliana', NULL),
	(20, '2025-12-24 20:00:00+00', 'Escala Anual', 'M. Dionatas', '', 100, 1, 10.60, '2026-02-02 22:23:36.329158+00', '', NULL),
	(24, '2026-01-29 20:00:00+00', 'Da Direção', 'M. Edson', '', 38, NULL, 0.00, '2026-02-08 19:46:17.647579+00', NULL, NULL),
	(25, '2026-01-31 20:00:00+00', 'Casal', 'M. Marcio Dagnoni', '', 58, NULL, 0.00, '2026-02-08 19:47:13.904398+00', NULL, NULL),
	(26, '2026-02-04 20:00:00+00', 'Quadro de Mestres', 'M. Wilton', '', 9, NULL, 0.00, '2026-02-08 19:48:06.671565+00', NULL, NULL),
	(27, '2026-02-07 20:00:00+00', 'Escala', 'M. Luiz Cardoso', 'M. Wilton', 91, NULL, 0.00, '2026-02-08 19:49:25.401016+00', 'Maíra ', NULL),
	(15, '2025-12-02 09:00:00+00', 'Extra', 'C. Leandro', '', 13, 1, 1.80, '2026-02-02 22:17:13.216923+00', '', NULL),
	(52, '2024-05-04 20:00:00+00', 'Escala', 'C. Tainá', 'Hanna Araújo', 0, NULL, 0.00, '2026-03-17 15:28:20.741564+00', 'Marilete', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(53, '2024-05-10 20:00:00+00', 'Preparo', 'M. Juarêz', '', 0, NULL, 0.00, '2026-03-17 15:29:16.457857+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(54, '2024-05-15 20:00:00+00', 'Extra', 'C. Aureliano', '', 0, NULL, 0.00, '2026-03-17 15:29:49.952263+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(28, '2026-02-13 20:00:00+00', 'Extra', 'André Luis Barbosa', '', 47, NULL, 0.00, '2026-02-14 06:36:51.467197+00', '', NULL),
	(31, '2026-02-17 15:00:00+00', 'Extra', 'C. Gelsiane', '', 51, NULL, 0.00, '2026-02-17 05:57:22.957702+00', '', 'cdb60f83-bd3b-46bd-9d26-25afc8f811da'),
	(32, '2026-02-21 20:00:00+00', 'Escala', 'M. Wilton', 'Ocelio', 86, NULL, 0.00, '2026-02-22 06:42:19.714311+00', 'Adson', '055e3331-e041-4eb3-8474-bac35762589a'),
	(55, '2024-05-18 20:00:00+00', 'Escala', 'M. Dionatas/M. Paiva', 'Leonel', 0, NULL, 0.00, '2026-03-17 15:30:33.433709+00', 'Rizzitelle', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(33, '2026-02-22 12:00:00+00', 'Instrutiva', 'M. Adriano', '', 60, NULL, 0.00, '2026-02-23 02:16:45.503882+00', '', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7'),
	(34, '2026-03-04 20:00:00+00', 'Extra', 'M. Jonas', '', 24, NULL, 0.00, '2026-03-05 06:03:51.932478+00', '', '6ee005ee-d293-4889-9d5d-9ec44a2c43f7'),
	(35, '2026-03-07 20:00:00+00', 'Escala', 'C. Gaspar', 'Jessica Liz', 84, NULL, 0.00, '2026-03-09 02:39:40.646345+00', 'Adriana', '055e3331-e041-4eb3-8474-bac35762589a'),
	(36, '2024-01-06 20:00:00+00', 'Escala Anual', 'M. Edson', 'M. Adriano', 0, NULL, 0.00, '2026-03-16 21:12:30.382053+00', 'Maria José', '055e3331-e041-4eb3-8474-bac35762589a'),
	(18, '2025-12-10 20:00:00+00', 'Quadro de Mestres', 'M. Juliano', '', 12, 8, 1.80, '2026-02-02 22:20:04.000416+00', '', NULL),
	(37, '2024-01-20 20:00:00+00', 'Escala', 'M. Jaques Douglas', 'Mariana Barbosa', 0, NULL, 0.00, '2026-03-17 15:05:43.398213+00', 'Bauer Gama', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(56, '2024-05-26 20:00:00+00', 'Instrutiva', 'M. Paiva', '', 0, NULL, 0.00, '2026-03-17 15:30:55.2353+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(57, '2024-06-01 20:00:00+00', 'Escala', 'M. Aureliano', '', 0, NULL, 0.00, '2026-03-17 15:32:07.257913+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(58, '2024-06-15 20:00:00+00', 'Escala', 'M. Wilton', 'C. Fátima (N. Rei Davi)', 0, NULL, 0.00, '2026-03-17 15:32:51.449919+00', 'Thais Regina', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(59, '2024-06-19 20:00:00+00', 'Quadro de Mestres', 'M. Marcos Paulo', '', 0, NULL, 0.00, '2026-03-17 15:33:23.04202+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(60, '2024-06-23 20:00:00+00', 'Escala Anual', 'M. Wellington', '', 0, NULL, 0.00, '2026-03-17 15:33:46.442758+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(61, '2024-06-29 20:00:00+00', 'Extra', 'M. Antonio', '', 0, NULL, 0.00, '2026-03-17 15:34:13.327815+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(62, '2024-07-06 20:00:00+00', 'Escala', 'M. Danilo ', '', 0, NULL, 0.00, '2026-03-17 15:35:02.451577+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(64, '2024-07-22 20:00:00+00', 'Escala Anual', 'M. Márcio Dagnoni', 'Juliana Barbosa', 0, NULL, 0.00, '2026-03-17 15:36:43.650009+00', 'Rafael', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(38, '2024-02-03 20:00:00+00', 'Escala', 'M. Edson', 'Igor Ramon', 0, NULL, 0.00, '2026-03-17 15:07:47.984317+00', 'C. Márcia Moreal', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(39, '2024-02-10 20:00:00+00', 'Escala Anual', 'M. Mário Marques', 'C. Neideane Moura', 0, NULL, 0.00, '2026-03-17 15:09:59.596796+00', 'Leandro', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(40, '2024-02-13 20:00:00+00', 'Extra', 'M. Sidnei ', '', 0, NULL, 0.00, '2026-03-17 15:11:01.772163+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(41, '2024-02-17 20:00:00+00', 'Escala', 'Matteus Luz', 'Maria José', 0, NULL, 0.00, '2026-03-17 15:11:53.531459+00', 'Letícia Moura', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(50, '2024-04-20 20:00:00+00', 'Escala', 'M. Edson', 'Taliny', 0, NULL, 0.00, '2026-03-17 15:26:27.441118+00', 'C. Juliano', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(44, '2024-03-09 20:00:00+00', 'Preparo', 'M. Venilson', '', 0, NULL, 0.00, '2026-03-17 15:18:01.532653+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(48, '2024-04-06 20:00:00+00', 'Escala', 'M. Antonio', 'Ana Beatriz Barros', 0, NULL, 0.00, '2026-03-17 15:24:38.26185+00', 'Paulo Pedrazza', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(65, '2024-08-03 20:00:00+00', 'Escala', 'C. Marcos', 'C. Juliano', 0, NULL, 0.00, '2026-03-18 04:13:13.081271+00', 'Rizzitelle', '055e3331-e041-4eb3-8474-bac35762589a'),
	(66, '2024-08-17 20:00:00+00', 'Escala', 'M. Antonio', 'C. Camila Condé', 0, NULL, 0.00, '2026-03-18 04:15:09.135056+00', 'Pedro Henrique', '055e3331-e041-4eb3-8474-bac35762589a'),
	(67, '2024-08-30 20:00:00+00', 'Casal', 'M. Edson', '', 0, NULL, 0.00, '2026-03-18 04:16:16.598345+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(68, '2024-09-01 12:00:00+00', 'Instrutiva', 'M. Manoel Gomes', '', 0, NULL, 0.00, '2026-03-18 04:17:12.348797+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(69, '2024-09-07 20:00:00+00', 'Escala Anual', 'M. Jeniscan', 'C. Emanuel', 0, NULL, 0.00, '2026-03-18 04:18:50.706873+00', 'C. Gaspar', '055e3331-e041-4eb3-8474-bac35762589a'),
	(70, '2024-09-21 20:00:00+00', 'Escala', 'M. Roberto Souto', '', 0, NULL, 0.00, '2026-03-18 04:20:06.233533+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(71, '2024-09-27 20:00:00+00', 'Extra', 'M. Wellington', '', 0, NULL, 0.00, '2026-03-18 04:23:18.678014+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(72, '2024-10-05 20:00:00+00', 'Escala', 'C. Emanuel', 'Thales Vasconcelos', 0, NULL, 0.00, '2026-03-18 04:24:58.106444+00', 'Marcelo Dagnoni', '055e3331-e041-4eb3-8474-bac35762589a'),
	(73, '2024-10-19 20:00:00+00', 'Escala', 'M. Marcos Paulo', 'Monique', 0, NULL, 0.00, '2026-03-18 04:26:10.939516+00', 'Charles Brasil', '055e3331-e041-4eb3-8474-bac35762589a'),
	(74, '2024-11-01 20:00:00+00', 'Escala Anual', 'M. Antonio', 'C. Expedito', 0, NULL, 0.00, '2026-03-18 04:32:24.490625+00', 'Elis Craveiro', '055e3331-e041-4eb3-8474-bac35762589a'),
	(75, '2024-11-17 20:00:00+00', 'Escala', 'M. Paulo Afonso', 'M. Francisco Gomes', 0, NULL, 0.00, '2026-03-18 04:35:44.507656+00', 'Ana Maria Condé', '055e3331-e041-4eb3-8474-bac35762589a'),
	(76, '2024-12-07 20:00:00+00', 'Escala', 'Leandro Postigo', 'C. Moura', 0, NULL, 0.00, '2026-03-18 04:37:10.324728+00', 'Jessica Liz', '055e3331-e041-4eb3-8474-bac35762589a'),
	(77, '2024-12-15 12:00:00+00', 'Instrutiva', 'M. Wilton', '', 0, NULL, 0.00, '2026-03-18 04:38:14.102048+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(78, '2024-12-21 20:00:00+00', 'Escala', 'C. Juliano', 'C. Alife', 0, NULL, 0.00, '2026-03-18 04:39:03.842133+00', 'Joseph', '055e3331-e041-4eb3-8474-bac35762589a'),
	(79, '2024-12-24 20:00:00+00', 'Escala Anual', 'M. Darilio', '', 0, NULL, 0.00, '2026-03-18 04:40:21.865966+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(80, '2024-02-28 20:00:00+00', 'Quadro de Mestres', 'M. Edson', '', 0, NULL, 0.00, '2026-03-18 04:42:58.234346+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(63, '2024-07-19 15:00:00+00', 'Da Direção', 'M. Edson', '', 0, NULL, 0.00, '2026-03-17 15:36:05.07947+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(81, '2024-08-24 20:00:00+00', 'Quadro de Mestres', 'M. Neto', '', 0, NULL, 0.00, '2026-03-18 04:45:39.402518+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(82, '2024-09-13 20:00:00+00', 'Adventício', 'M. Dionatas', '', 0, NULL, 0.00, '2026-03-18 04:55:04.808315+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(83, '2024-09-15 20:00:00+00', 'Extra', 'M. Sanderson', '', 0, NULL, 0.00, '2026-03-18 04:58:30.286794+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(84, '2024-09-28 16:00:00+00', 'Extra', 'C. Emanuel', '', 0, NULL, 0.00, '2026-03-18 04:59:19.454184+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(85, '2024-10-04 20:00:00+00', 'Preparo', 'M. Wilton', '', 0, NULL, 0.00, '2026-03-18 04:59:58.799511+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(86, '2024-10-13 16:00:00+00', 'Extra', 'Jussiney', '', 0, NULL, 0.00, '2026-03-18 05:01:05.742545+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(87, '2024-10-25 20:00:00+00', 'Quadro de Mestres', 'M. Sérgio', '', 0, NULL, 0.00, '2026-03-18 05:02:23.378126+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(88, '2024-11-09 20:00:00+00', 'Preparo', 'M. Sidnei', '', 0, NULL, 0.00, '2026-03-18 05:03:25.890769+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(89, '2024-11-19 20:00:00+00', 'Extra', 'Antonio do Carmo', '', 0, NULL, 0.00, '2026-03-18 05:04:02.904552+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(90, '2024-11-30 20:00:00+00', 'Casal', 'M. Dionatas', '', 0, NULL, 0.00, '2026-03-18 05:04:18.89268+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(91, '2024-12-01 20:00:00+00', 'Extra', 'M. Sidnei', '', 0, NULL, 0.00, '2026-03-18 05:05:07.492142+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(92, '2024-12-05 20:00:00+00', 'Quadro de Mestres', 'M. Edson', '', 0, NULL, 0.00, '2026-03-18 05:06:02.787143+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(93, '2024-12-13 20:00:00+00', 'Da Direção', 'M. Edson', '', 0, NULL, 0.00, '2026-03-18 05:06:37.527906+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(94, '2024-12-31 20:00:00+00', 'Extra', 'M. Adriano', '', 0, NULL, 0.00, '2026-03-18 05:07:21.540943+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(42, '2024-02-18 07:00:00+00', 'Instrutiva', 'M. Edson', '', 0, NULL, 0.00, '2026-03-17 15:12:44.474042+00', '', '862772cd-2010-4108-aac3-22510f7d5f3a'),
	(95, '2025-01-06 20:00:00+00', 'Escala Anual', 'M. Edson', 'C. Leandro', 0, NULL, 0.00, '2026-03-19 01:33:46.21607+00', 'Diego', '055e3331-e041-4eb3-8474-bac35762589a'),
	(96, '2025-01-11 20:00:00+00', 'Preparo', 'M. Aureliano', '', 0, NULL, 0.00, '2026-03-19 01:37:02.36257+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(97, '2025-01-18 20:00:00+00', 'Escala', 'M. Wilton / M. Aureliano', 'C. Gelsiane', 0, NULL, 0.00, '2026-03-19 01:38:58.193292+00', 'Matheus Souza', '055e3331-e041-4eb3-8474-bac35762589a'),
	(98, '2025-02-01 20:00:00+00', 'Escala', 'M. Jonas', 'Denis', 0, NULL, 0.00, '2026-03-19 01:40:52.760647+00', 'Marcos Filho', '055e3331-e041-4eb3-8474-bac35762589a'),
	(99, '2025-02-10 20:00:00+00', 'Escala Anual', 'M. Wellington', 'C. Victor Henrique', 0, NULL, 0.00, '2026-03-19 01:43:00.888547+00', 'Lucas Bezerra', '055e3331-e041-4eb3-8474-bac35762589a'),
	(100, '2025-02-15 20:00:00+00', 'Escala', 'M. Dionatas', 'Rizzitelle', 0, NULL, 0.00, '2026-03-19 01:44:36.50201+00', 'Ana Beatriz Moreal', '055e3331-e041-4eb3-8474-bac35762589a'),
	(101, '2025-03-01 20:00:00+00', 'Escala', 'C. Gabriela', 'Lucas Bezerra', 0, NULL, 0.00, '2026-03-19 01:48:33.614522+00', 'Leticia de Pardo', '055e3331-e041-4eb3-8474-bac35762589a'),
	(102, '2025-03-15 20:00:00+00', 'Escala', 'M. Neto', 'Alan Bonazoni', 0, NULL, 0.00, '2026-03-19 01:50:07.682865+00', 'Kézio Araujo', '055e3331-e041-4eb3-8474-bac35762589a'),
	(103, '2025-03-16 12:00:00+00', 'Instrutiva', 'M. Antonio', '', 0, NULL, 0.00, '2026-03-19 01:51:24.352991+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(104, '2025-03-27 20:00:00+00', 'Escala Anual', 'M. Aureliano / M. Wellington', 'C. Ronaldo', 0, NULL, 0.00, '2026-03-19 01:52:42.643217+00', 'Jessica Liz', '055e3331-e041-4eb3-8474-bac35762589a'),
	(105, '2025-04-12 20:00:00+00', 'Extra', 'M. Dionatas', '', 0, NULL, 0.00, '2026-03-19 01:53:22.900947+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(106, '2025-04-05 20:00:00+00', 'Escala', 'M. Adriano', 'C. Juliano', 0, NULL, 0.00, '2026-03-19 01:54:40.076422+00', 'C. Lucia Abud', '055e3331-e041-4eb3-8474-bac35762589a'),
	(107, '2025-04-19 20:00:00+00', 'Escala', 'M. Edson', 'C. José Lopes', 0, NULL, 0.00, '2026-03-19 01:58:05.569379+00', 'Celeste', '055e3331-e041-4eb3-8474-bac35762589a'),
	(108, '2025-05-03 20:00:00+00', 'Preparo', 'M. Jean Bonazoni', '', 0, NULL, 0.00, '2026-03-19 02:00:31.367146+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(109, '2025-05-10 16:00:00+00', 'Extra', 'Maria José', '', 0, NULL, 0.00, '2026-03-19 02:01:23.004304+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(110, '2025-05-17 20:00:00+00', 'Escala', 'M. Wellington / M. Dionatas', 'Carlos Alberto', 0, NULL, 0.00, '2026-03-19 02:03:01.853944+00', 'Letícia Chaves', '055e3331-e041-4eb3-8474-bac35762589a'),
	(111, '2025-06-08 12:00:00+00', 'Instrutiva', 'M. Dionatas', '', 0, NULL, 0.00, '2026-03-19 02:03:44.113315+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(112, '2025-06-07 20:00:00+00', 'Escala', 'C. Juliano', 'C. Gabriela', 0, NULL, 0.00, '2026-03-19 02:30:52.416852+00', 'Isaias', '055e3331-e041-4eb3-8474-bac35762589a'),
	(114, '2025-06-23 20:00:00+00', 'Escala Anual', 'M. Edson', '', 0, NULL, 0.00, '2026-03-19 02:35:17.971747+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(115, '2025-06-30 20:00:00+00', 'Da Direção', 'M. Edson', '', 0, NULL, 0.00, '2026-03-19 02:35:38.441288+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(116, '2025-07-02 20:00:00+00', 'Quadro de Mestres', 'M. Dionatas', '', 0, NULL, 0.00, '2026-03-19 02:36:05.890701+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(117, '2025-07-05 20:00:00+00', 'Escala', 'M. Manoel Gomes', 'C. Alessandra', 0, NULL, 0.00, '2026-03-19 02:45:08.531015+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(118, '2025-07-22 20:00:00+00', 'Escala Anual', 'M. Edson', 'C. Marcos', 0, NULL, 0.00, '2026-03-19 02:46:48.949321+00', 'Lucas Bezerra', '055e3331-e041-4eb3-8474-bac35762589a'),
	(119, '2025-07-31 20:00:00+00', 'Extra', 'M. Adriano', '', 0, NULL, 0.00, '2026-03-19 02:48:04.721122+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(120, '2025-08-02 20:00:00+00', 'Escala', 'C. Luciano', 'C. Ronaldo', 0, NULL, 0.00, '2026-03-19 02:49:18.826897+00', 'Rizzitelle', '055e3331-e041-4eb3-8474-bac35762589a'),
	(121, '2025-08-30 20:00:00+00', 'Casal', 'M. Adriano', '', 0, NULL, 0.00, '2026-03-19 02:49:59.564987+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(123, '2025-10-24 20:00:00+00', 'Adventício', 'M. Juliano', 'C. Maria José', 0, NULL, 0.00, '2026-03-21 14:54:35.248625+00', 'Adriana', '055e3331-e041-4eb3-8474-bac35762589a'),
	(122, '2025-10-18 20:00:00+00', 'Escala', 'C. Antonia', 'C. Marcos', 0, NULL, 0.00, '2026-03-21 14:53:09.01494+00', 'Ariel Gomes', '055e3331-e041-4eb3-8474-bac35762589a'),
	(124, '2025-10-26 16:00:00+00', 'Caráter Instrutivo', 'M. Edson', '', 0, NULL, 0.00, '2026-03-21 14:55:59.472459+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(125, '2025-11-01 20:00:00+00', 'Escala Anual', 'M. Arlindo', 'C. Ronaldo', 0, NULL, 0.00, '2026-03-21 14:56:38.906072+00', 'João Gabriel', '055e3331-e041-4eb3-8474-bac35762589a'),
	(126, '2025-11-08 16:00:00+00', 'Extra', 'C. Moura', '', 0, NULL, 0.00, '2026-03-21 14:57:09.341494+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(127, '2025-11-15 20:00:00+00', 'Escala', 'M. Wilton / M. Juliano', 'C. Denis', 0, NULL, 0.00, '2026-03-21 14:57:55.7533+00', 'Patricia', '055e3331-e041-4eb3-8474-bac35762589a'),
	(128, '2025-10-10 20:00:00+00', 'Da Direção', 'M. Wilton', '', 0, NULL, 0.00, '2026-03-21 15:00:14.52315+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(129, '2025-10-04 20:00:00+00', 'Escala', 'C. Gaspar', 'C. Elione', 0, NULL, 0.00, '2026-03-21 15:03:07.997497+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(130, '2025-08-16 20:00:00+00', 'Escala', 'Alan Bonazoni', 'Leonel', 0, NULL, 0.00, '2026-03-21 15:04:33.32541+00', 'Celeste', '055e3331-e041-4eb3-8474-bac35762589a'),
	(132, '2025-09-07 16:00:00+00', 'Escala Anual', 'M. Carmiro Junior', 'M. Mário Marques', 0, NULL, 0.00, '2026-03-21 15:06:03.30193+00', 'Océlio', '055e3331-e041-4eb3-8474-bac35762589a'),
	(113, '2025-06-18 20:00:00+00', 'Adventício', 'M. José Roberto', 'Valden Rocha', 0, NULL, 0.00, '2026-03-19 02:34:56.491042+00', 'Rosa Rocha', '055e3331-e041-4eb3-8474-bac35762589a'),
	(134, '2025-01-08 20:00:00+00', 'Adventício', 'M. Wilton', '', 0, NULL, 0.00, '2026-03-21 15:13:15.344985+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(135, '2025-02-22 20:00:00+00', 'Extra', 'C. Naila', '', 0, NULL, 0.00, '2026-03-21 15:14:06.93788+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(136, '2025-02-26 20:00:00+00', 'Quadro de Mestres', 'M. Márcio Dagnoni', '', 0, NULL, 0.00, '2026-03-21 15:14:46.595793+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(137, '2025-03-03 16:00:00+00', 'Extra', 'C. Marcos', '', 0, NULL, 0.00, '2026-03-21 15:15:42.599687+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(138, '2025-03-20 20:00:00+00', 'Da Direção', 'M. Edson', '', 0, NULL, 0.00, '2026-03-21 15:16:38.847726+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(139, '2025-04-17 20:00:00+00', 'Quadro de Mestres', 'M. Darílio', '', 0, NULL, 0.00, '2026-03-21 15:17:29.122327+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(131, '2025-08-23 20:00:00+00', 'Extra', 'C. Marcos', '', 0, NULL, 0.00, '2026-03-21 15:05:06.947522+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(133, '2025-09-20 20:00:00+00', 'Escala', 'M. Adriano / M. Wilton', 'C. Moura', 0, NULL, 0.00, '2026-03-21 15:07:06.269841+00', 'C. Márcia', '055e3331-e041-4eb3-8474-bac35762589a'),
	(140, '2025-09-21 12:00:00+00', 'Instrutiva', 'M. Wellington', '', 0, NULL, 0.00, '2026-03-21 15:19:58.566299+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(141, '2025-09-24 20:00:00+00', 'Quadro de Mestres', 'M. Adriano', '', 0, NULL, 0.00, '2026-03-21 15:20:24.925259+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(142, '2025-09-27 20:00:00+00', 'Extra', 'M. Jonas', '', 0, NULL, 0.00, '2026-03-21 15:21:11.205943+00', '', '055e3331-e041-4eb3-8474-bac35762589a'),
	(143, '2026-03-22 20:00:00+00', 'Escala', 'M. Márcio/ M. Aureliano', 'C. João Lima Neto', 92, NULL, 0.00, '2026-03-22 06:23:28.372541+00', NULL, 'cdb60f83-bd3b-46bd-9d26-25afc8f811da');


--
-- Data for Name: consumos_sessao; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."consumos_sessao" ("id", "id_sessao", "id_preparo", "quantidade_consumida", "created_at") VALUES
	(2, 16, 1, 9.90, '2026-02-07 22:49:32.817021+00'),
	(3, 17, 1, 6.00, '2026-02-07 22:49:32.817021+00'),
	(5, 19, 1, 8.00, '2026-02-07 22:49:32.817021+00'),
	(9, 23, 1, 8.50, '2026-02-07 22:49:32.817021+00'),
	(12, 21, 1, 10.25, '2026-02-08 17:27:28.142022+00'),
	(13, 21, 7, 3.30, '2026-02-08 17:27:28.142022+00'),
	(20, 22, 8, 4.30, '2026-02-08 19:13:57.591251+00'),
	(21, 22, 4, 4.10, '2026-02-08 19:13:57.591251+00'),
	(22, 20, 1, 8.80, '2026-02-08 19:35:23.35356+00'),
	(23, 20, 4, 1.80, '2026-02-08 19:35:23.35356+00'),
	(24, 24, 4, 3.60, '2026-02-08 19:46:18.013754+00'),
	(25, 25, 4, 5.90, '2026-02-08 19:47:14.589155+00'),
	(26, 26, 4, 1.30, '2026-02-08 19:48:06.946985+00'),
	(28, 27, 4, 8.70, '2026-02-08 21:38:03.660046+00'),
	(29, 15, 1, 1.80, '2026-02-08 21:46:12.051557+00'),
	(34, 28, 12, 4.20, '2026-02-15 17:03:34.690263+00'),
	(35, 28, 1, 0.60, '2026-02-15 17:03:34.690263+00'),
	(39, 31, 1, 6.20, '2026-02-19 02:26:32.038959+00'),
	(41, 32, 11, 8.35, '2026-02-22 15:45:17.810191+00'),
	(44, 33, 1, 6.70, '2026-02-27 21:52:55.022385+00'),
	(46, 34, 1, 2.50, '2026-03-05 15:18:44.451547+00'),
	(48, 35, 1, 7.90, '2026-03-09 15:13:15.600964+00'),
	(49, 18, 8, 1.80, '2026-03-17 02:39:01.313305+00'),
	(50, 143, 14, 10.20, '2026-03-22 06:23:28.81316+00');


--
-- Data for Name: historias; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: leituras; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "full_name", "updated_at") VALUES
	('055e3331-e041-4eb3-8474-bac35762589a', 'Artur Araújo', '2026-02-15 22:55:44.447+00'),
	('410073d0-3d36-4cf7-bc32-0decf57a6562', 'Representação Geral', '2026-02-16 16:45:36.971+00'),
	('cdb60f83-bd3b-46bd-9d26-25afc8f811da', 'Márcio ', '2026-02-17 05:55:30.147+00'),
	('6ee005ee-d293-4889-9d5d-9ec44a2c43f7', 'Alan', '2026-02-23 02:13:59.019+00'),
	('15eb4cb5-8b61-4f8e-b203-9ecd1f1e2c9c', 'Artur Lopes Chaves', '2026-02-25 03:15:05.134+00'),
	('862772cd-2010-4108-aac3-22510f7d5f3a', 'Jéssica Liz', '2026-03-17 14:56:17.142+00'),
	('73608c46-04c5-40a1-8e37-be7b736c54b9', 'Christian Juliano Moreal ', '2026-03-19 13:08:15.937+00'),
	('ac37ee3f-8c43-412b-9bfa-01678f9cea7a', 'Aurėliano Chaves', '2026-03-22 07:09:29.736+00');


--
-- Data for Name: saidas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."saidas" ("id", "created_at", "data_saida", "quantidade", "destino", "preparo_id", "observacoes") VALUES
	(2, '2026-02-02 21:37:48.858715+00', '2025-11-25', 53, 'Reforço', 4, ''),
	(1, '2026-02-02 13:45:05.230919+00', '2026-02-02', 12, 'Mestre Central', 1, ''),
	(4, '2026-02-02 22:20:38.142017+00', '2025-12-19', 0.9, 'Ver o grau', 7, ''),
	(5, '2026-02-08 19:57:00.462616+00', '2026-02-08', 45.35, 'Balanço do estoque', 4, ''),
	(8, '2026-03-22 05:35:44.83594+00', '2026-03-18', 6, 'DAV Assis Brasil ', 14, NULL),
	(9, '2026-03-22 07:04:21.78564+00', '2026-03-18', 0.4, 'Dav Assis brasil - M. Juarez', 14, NULL);


--
-- Data for Name: visitantes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 213, true);


--
-- Name: consumos_sessao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."consumos_sessao_id_seq"', 50, true);


--
-- Name: historias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."historias_id_seq"', 1, false);


--
-- Name: leituras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."leituras_id_seq"', 2, true);


--
-- Name: preparos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."preparos_id_seq"', 14, true);


--
-- Name: saidas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."saidas_id_seq"', 9, true);


--
-- Name: sessoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."sessoes_id_seq"', 144, true);


--
-- Name: visitantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."visitantes_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict keZhuV1Kf2MFisybEyNcH9zj73C96KeFfKf4iRO5pDKCkBW5jq9vrgCHS6vadeY

RESET ALL;
