-- Import data to Supabase

-- Auth Users
INSERT INTO auth_users (username, password, name, role, created_at, updated_at, last_login) VALUES
('admin', '$2b$10$871xTkUwpFCIz3UPQJfzgeTRu6n8I8J79lOrnofdAnGUdna4V1BB2', 'Administrator', 'admin', '2025-10-24T09:53:43.000Z', '2025-10-24T10:22:21.000Z', '2025-10-24T10:22:22.000Z');

-- Employees
INSERT INTO employees (name, email, address, joining_date, designation, salary, status, created_at, updated_at) VALUES
('Rajesh Kumar', 'rajesh.kumar@neuron.com', '123 MG Road, Bangalore, Karnataka', '2023-01-15T00:00:00.000Z', 'Senior Software Engineer', 85000, 'active', '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
('Priya Sharma', 'priya.sharma@neuron.com', '456 Connaught Place, New Delhi', '2023-03-20T00:00:00.000Z', 'Product Manager', 95000, 'active', '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
('Amit Patel', 'amit.patel@neuron.com', '789 Marine Drive, Mumbai, Maharashtra', '2022-11-10T00:00:00.000Z', 'UI/UX Designer', 70000, 'active', '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
('Sneha Reddy', 'sneha.reddy@neuron.com', '321 Jubilee Hills, Hyderabad, Telangana', '2023-05-01T00:00:00.000Z', 'HR Manager', 75000, 'active', '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
('Vikram Singh', 'vikram.singh@neuron.com', '654 Park Street, Kolkata, West Bengal', '2022-08-15T00:00:00.000Z', 'DevOps Engineer', 80000, 'active', '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
('Ananya Iyer', 'ananya.iyer@neuron.com', '987 Anna Salai, Chennai, Tamil Nadu', '2023-02-28T00:00:00.000Z', 'Data Analyst', 65000, 'active', '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z');

-- Holidays
INSERT INTO holidays (employee_id, month, year, leaves_taken, created_at, updated_at) VALUES
(1, 10, 2025, 1, '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
(2, 10, 2025, 2, '2025-10-24T09:13:58.000Z', '2025-10-24T09:43:47.000Z'),
(3, 10, 2025, 1, '2025-10-24T09:13:58.000Z', '2025-10-24T09:43:48.000Z'),
(4, 10, 2025, 1, '2025-10-24T09:13:58.000Z', '2025-10-24T09:43:49.000Z'),
(5, 10, 2025, 1, '2025-10-24T09:13:58.000Z', '2025-10-24T09:43:50.000Z'),
(6, 10, 2025, 1, '2025-10-24T09:13:58.000Z', '2025-10-24T09:13:58.000Z'),
(3, 2, 2025, 3, '2025-10-24T09:26:17.000Z', '2025-10-24T09:26:17.000Z');

-- Payslips
INSERT INTO payslips (employee_id, month, year, gross_salary, tds, deductions, net_salary, created_at) VALUES
(1, 2, 2024, 85000, 8500, 0, 76500, '2025-10-24T09:16:52.000Z'),
(2, 2, 2024, 95000, 9500, 0, 85500, '2025-10-24T09:16:53.000Z'),
(3, 2, 2024, 70000, 7000, 0, 63000, '2025-10-24T09:16:54.000Z'),
(4, 2, 2024, 75000, 7500, 0, 67500, '2025-10-24T09:16:54.000Z'),
(5, 2, 2024, 80000, 8000, 0, 72000, '2025-10-24T09:16:55.000Z'),
(6, 2, 2024, 65000, 6500, 0, 58500, '2025-10-24T09:16:56.000Z'),
(1, 2, 2023, 85000, 8500, 0, 76500, '2025-10-24T09:26:39.000Z'),
(2, 2, 2023, 95000, 9500, 0, 85500, '2025-10-24T09:26:39.000Z'),
(3, 2, 2023, 70000, 7000, 0, 63000, '2025-10-24T09:26:40.000Z'),
(4, 2, 2023, 75000, 7500, 0, 67500, '2025-10-24T09:26:41.000Z'),
(5, 2, 2023, 80000, 8000, 0, 72000, '2025-10-24T09:26:41.000Z'),
(6, 2, 2023, 65000, 6500, 0, 58500, '2025-10-24T09:26:42.000Z');

-- Settings
INSERT INTO settings (leave_quota_per_month, tds_rate, working_days_per_month, created_at, updated_at) VALUES
(2, 10, 22, '2025-10-24T09:12:16.000Z', '2025-10-24T09:12:16.000Z');

