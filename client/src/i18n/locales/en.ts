const translations = {
  app: {
    name: "Wallet Save",
    slogan: "Smart finance management",
    tagline: "Manage your finances with confidence",
  },
  common: {
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    loading: "Loading...",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    filter: "Filter",
    apply: "Apply",
    clear: "Clear",
    close: "Close",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    view_all: "View All",
    total: "Total",
    no_data: "No data available",
    select_all: "Select All",
  },
  auth: {
    login: "Login",
    register: "Register",
    logout: "Logout",
    username: "Email",
    username_placeholder: "your@email.com",
    password: "Password",
    forgot_password: "Forgot your password?",
    reset_password: "Reset Password",
    reset_password_description: "Enter your email to receive a password reset link.",
    reset_password_page_description: "Enter and confirm your new password.",
    send_reset_link: "Send Link",
    reset_link_sent_title: "Reset link sent",
    reset_link_sent_description: "Check your email for password reset instructions.",
    check_email_for_reset: "Check your email to reset your password.",
    new_password: "New Password",
    update_password: "Update Password",
    invalid_token_title: "Invalid Link",
    invalid_token_description: "This password reset link is invalid or has expired.",
    back_to_login: "Back to Login",
    confirm_password: "Confirm Password",
    full_name: "Full Name",
    full_name_placeholder: "Your Name",
    logging_in: "Logging in...",
    registering: "Registering...",
    updating: "Updating...",
    terms_agreement: "By continuing, you agree to our",
    terms_of_service: "Terms of Service",
    and: "and",
    privacy_policy: "Privacy Policy",
    slogan: "Smart expense tracking",
    or: "or",
    confirm_email: "Confirm your email",
    code_sent_to: "Code sent to",
    checking: "Checking...",
    confirm: "Confirm",
    no_code: "No code received?",
    sending: "Sending...",
    send_again: "Resend code",
    register_success: "Registration successful",
    email_verified: "Email verified",
    email_verified_description: "Your email has been successfully verified.",
    verification_error: "Verification error",
    verification_required: "Verification required",
    verification_code_resent: "A new verification code has been sent to your email.",
    code_resent: "Code resent",
    resend_error: "Error resending code",
  },
  navigation: {
    home: "Home",
    wallet: "Wallet",
    reports: "Reports",
    savings: "Savings",
    notifications: "Notifications",
    finance: "Finances",
  },
  finance: {
    overview: "Overview",
    recent_expenses: "Recent Expenses",
    manage_wallets: "Manage Wallets",
    financial_summary: "Financial Summary",
    budget: "Budget",
    total_balance: "Total Balance",
    add_balance: "Add Balance",
    amount_to_add: "Amount to add",
    balance_added: "Balance added",
    balance_added_description: "Your balance has been updated successfully",
    balance_error: "Error adding balance",
    remaining_balance: "Remaining Balance",
  },
  reports: {
    monthly: "Monthly",
    daily: "Daily",
    trends: "Trends",
    expense_trends: "Spending History",
    expense_trends_description: "View your spending patterns over the last 6 months",
    daily_expenses: "Daily Spending",
    daily_expenses_description: "View your daily spending for this month",
    category_distribution_description: "See how your money is distributed across categories",
    recent_expenses: "Recent Expenses",
  },
  expense: {
    expenses: "Expenses",
    add_expense: "Add Expense",
    edit_expense: "Edit Expense",
    description: "Description",
    description_placeholder: "E.g. Rent",
    amount: "Amount",
    date: "Date",
    select_date: "Select a date",
    category: "Category",
    select_category: "Select a category",
    type: "Type",
    fixed: "Fixed",
    variable: "Variable",
    recurring: "Recurring expense",
    frequency: "Frequency",
    select_frequency: "Select frequency",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    end_date: "End date",
    select_end_date: "Select end date",
    delete: "Delete",
    duplicate: "Duplicate",
    edit: "Edit",
    mark_paid: "Mark as paid",
    mark_unpaid: "Mark as unpaid",
    no_expenses: "No expenses to show",
    no_expenses_for_chart: "Add expenses to see the chart",
    total: "Total",
    distribution: "Expense Distribution",
    paid: "Paid",
    unpaid: "Unpaid",
    my_expenses: "My Expenses",
    today: "Today",
    yesterday: "Yesterday",
    distribution_by_category: "Distribution by Category",
    recent_expenses: "Recent Expenses",
    add_new_expense: "Add New Expense",
    expense_details: "Expense Details",
  },
  category: {
    add_category: "Add Category",
    edit_category: "Edit Category",
    name: "Name",
    name_placeholder: "E.g. Housing",
    color: "Color",
    icon: "Icon",
    select_icon: "Select an icon",
    categories: "Categories",
  },
  categories: {
    housing: "Housing",
    transportation: "Transportation",
    food: "Food",
    utilities: "Utilities",
    healthcare: "Healthcare",
    health: "Health",
    personal: "Personal",
    entertainment: "Entertainment",
    education: "Education",
    debt: "Debt",
    savings: "Savings",
    shopping: "Shopping",
    gifts: "Gifts",
    other: "Other",
    unknown: "Unknown",
  },
  budget: {
    budget: "Budget",
    overview: "Month Overview",
    add_budget: "Add Budget",
    edit_budget: "Edit Budget",
    income: "Income",
    expenses: "Expenses",
    remaining: "Remaining",
    saved: "Saved",
    budget_used: "Budget used",
    income_placeholder: "E.g. 5000",
    setup_budget: "Set up your monthly budget",
    no_budget: "No budget for this month",
    monthly_budget: "Monthly Budget",
  },
  wallet: {
    wallet: "Wallet",
    wallets: "Wallets",
    add_wallet: "Add Wallet",
    edit_wallet: "Edit Wallet",
    name: "Wallet Name",
    balance: "Balance",
    name_placeholder: "E.g. Main Wallet",
    balance_placeholder: "Current balance",
    no_wallets: "No wallets to show",
    total: "Total Balance",
    delete_wallet: "Delete Wallet",
    delete_wallet_description: "Are you sure you want to delete this wallet? This action cannot be undone.",
    manage_wallets: "Manage Wallets",
  },
  saving: {
    savings: "Savings",
    target: "Target",
    current: "Current",
    add_saving: "Add Saving Goal",
    edit_saving: "Edit Saving Goal",
    name: "Goal Name",
    name_placeholder: "E.g. Vacation",
    target_amount: "Target Amount",
    current_amount: "Current Amount",
    no_savings: "No savings to show",
    progress: "Progress",
    total: "Total Saved",
    delete_saving: "Delete Saving Goal",
    delete_saving_description: "Are you sure you want to delete this saving goal? This action cannot be undone.",
  },
  profile: {
    my_profile: "My Profile",
    edit_profile: "Edit Profile",
    settings: "Settings",
    language: "Language",
    currency: "Currency",
    dark_mode: "Dark Mode",
    light_mode: "Light Mode",
    toggle_theme: "Toggle theme",
    logout: "Logout",
    logging_out: "Logging out...",
    update_profile: "Update Profile",
    username: "Username",
    full_name: "Full Name",
    password: "Password",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    leave_blank_password: "Leave blank to keep current password",
    danger_zone: "Danger Zone",
    delete_account: "Delete Account",
    delete_account_warning: "Once you delete your account, there is no going back. Please be certain.",
    confirm_deletion: "Confirm Account Deletion",
    deletion_warning: "This action cannot be undone. This will permanently delete your account and remove all your data from our servers.",
    confirm_delete: "Yes, delete my account",
  },
  notifications: {
    saving_goals: "Saving Goals",
    title: "Notifications",
    due_today: "{{description}} is due today!",
    upcoming_expense: "{{description}} due on {{date}}",
    upcoming_expenses: "Upcoming Expenses",
    view_all: "View all",
    no_notifications: "No notifications",
    enable: "Enable Notifications",
    enabled: "Notifications Enabled",
    enabled_title: "Notifications Enabled",
    enabled_description: "You will now receive important financial alerts",
    permission_title: "Notification Permission Required",
    permission_description: "Please enable notifications in your browser settings to receive important financial alerts.",
    budget_warning_title: "Budget Alert",
    budget_warning_body: "You've used {{percent}}% of your monthly budget. Consider spending more carefully.",
    budget_exceeded_title: "Budget Exceeded",
    budget_exceeded_body: "You've exceeded your monthly budget. Review your expenses now.",
    savings_title: "Savings Success",
    savings_body: "Great job! You're making progress on your savings goals this month.",
    insufficient_funds_title: "Insufficient Funds Alert",
    insufficient_funds_body: "You have {{pending}} in pending expenses but only {{available}} available. Plan accordingly.",
    saving_goal_reached_title: "Savings Goal Achieved!",
    saving_goal_reached_body: "Congratulations! You've reached your goal of {{amount}} for {{name}}.",
    saving_goal_near_title: "Savings Goal Within Reach!",
    saving_goal_near_body: "You're at {{percent}}% of your target for {{name}}. Keep it up!",
    checking_goals: "Checking Goals",
    checking_goals_description: "Checking savings goals progress...",
    checking_goal: "Checking goal",
    check_saving_goals: "Check Saving Goals",
    check_saving_goals_description: "Check the status of your saving goals",
  },
  validation: {
    username_required: "Email is required",
    password_required: "Password is required",
    password_min_length: "Password must be at least 6 characters",
    confirm_password_required: "Please confirm your password",
    passwords_must_match: "Passwords must match",
    full_name_required: "Full name is required",
    description_required: "Description is required",
    amount_required: "Amount is required",
    amount_positive: "Amount must be positive",
    date_required: "Date is required",
    category_required: "Category is required",
    name_required: "Name is required",
    target_required: "Target amount is required",
    code_six_digits: "Code must be 6 digits",
    code_numbers_only: "Code must contain only numbers",
  },
  toast: {
    error: "Error",
    success: "Success",
    loginFailed: "Login failed",
    registrationFailed: "Registration failed",
    logoutFailed: "Logout failed",
    expense_added: "Expense added",
    expense_added_description: "Your expense has been added successfully",
    expense_updated: "Expense updated",
    expense_updated_description: "Your expense has been updated successfully",
    expense_deleted: "Expense deleted",
    expense_deleted_description: "Your expense has been deleted successfully",
    expense_duplicated: "Expense duplicated",
    expense_duplicated_description: "Your expense has been duplicated successfully",
    expense_marked_paid: "Expense marked as paid",
    expense_marked_paid_description: "Your expense has been marked as paid",
    expense_marked_unpaid: "Expense marked as unpaid",
    expense_marked_unpaid_description: "Your expense has been marked as unpaid",
    budget_updated: "Budget updated",
    budget_updated_description: "Your budget has been updated successfully",
    wallet_added: "Wallet added",
    wallet_added_description: "Your wallet has been added successfully",
    wallet_updated: "Wallet updated",
    wallet_updated_description: "Your wallet has been updated successfully",
    wallet_deleted: "Wallet deleted",
    wallet_deleted_description: "Your wallet has been deleted successfully",
    saving_added: "Saving goal added",
    saving_added_description: "Your saving goal has been added successfully",
    saving_updated: "Saving goal updated",
    saving_updated_description: "Your saving goal has been updated successfully",
    saving_deleted: "Saving goal deleted",
    saving_deleted_description: "Your saving goal has been deleted successfully",
    profile_updated: "Profile updated",
    profile_updated_description: "Your profile has been updated successfully",
    account_deleted: "Account deleted",
    account_deleted_description: "Your account has been successfully deleted. All your data has been removed.",
  },
  months: {
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
  },
  legal: {
    terms_of_service: "Terms of Service",
    privacy_policy: "Privacy Policy",
    // Terms of Service translations
    terms_title: "Terms of Service for Wallet Save",
    terms_last_updated: "Last updated: April 28, 2025",
    terms_section_1_title: "1. Agreement to Terms",
    terms_section_1_content: "By accessing or using the Wallet Save application, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this application.",
    terms_section_2_title: "2. Use License",
    terms_section_2_content: "Permission is granted to temporarily use the Wallet Save application for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not modify, copy, distribute, transmit, display, perform, reproduce, publish, license, create derivative works from, transfer, or sell any information obtained from the application.",
    terms_section_3_title: "3. User Account",
    terms_section_3_content: "To use certain features of the application, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.",
    terms_section_4_title: "4. User Data",
    terms_section_4_content: "You own all the data you input into the application. We do not claim ownership over any of your data. However, by using the application, you grant us a license to use your data to provide and improve our services.",
    terms_section_5_title: "5. Disclaimer",
    terms_section_5_content: "The Wallet Save application is provided 'as is' without warranties of any kind, either expressed or implied. We do not warrant that the application will be uninterrupted or error-free, that defects will be corrected, or that the application is free of viruses or other harmful components.",
    terms_section_6_title: "6. Limitation of Liability",
    terms_section_6_content: "In no event shall Wallet Save be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the application, even if we have been notified of the possibility of such damage.",
    terms_section_7_title: "7. Changes to Terms",
    terms_section_7_content: "We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on the application. Changes to Terms of Service are effective when they are posted on this page.",
    terms_section_8_title: "8. Governing Law",
    terms_section_8_content: "These terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions.",
    // Privacy Policy translations
    privacy_title: "Privacy Policy for Wallet Save",
    privacy_last_updated: "Last updated: April 28, 2025",
    privacy_section_1_title: "1. Information We Collect",
    privacy_section_1_content: "We collect information you provide directly to us when you create an account (such as your name, email address) and when you use our application (such as financial data you input). We do not collect information about you from other sources.",
    privacy_section_2_title: "2. How We Use Your Information",
    privacy_section_2_content: "We use the information we collect to provide, maintain, and improve our services, including to process transactions, send you related information, and provide customer support.",
    privacy_section_3_title: "3. Data Storage",
    privacy_section_3_content: "All of your personal data is stored locally on your device. We do not store your financial data on our servers. Your account information is securely stored to allow you to access your account across devices.",
    privacy_section_4_title: "4. Data Security",
    privacy_section_4_content: "We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.",
    privacy_section_5_title: "5. Your Rights",
    privacy_section_5_content: "You can access, update, or delete your information at any time through the application settings. You can also request a copy of your data or request that we delete all your data permanently.",
    privacy_section_6_title: "6. Children's Privacy",
    privacy_section_6_content: "Our application is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected personal information from a child under 13, we will delete that information.",
    privacy_section_7_title: "7. Changes to Privacy Policy",
    privacy_section_7_content: "We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. Changes to the Privacy Policy are effective when they are posted on this page.",
    // Contact information
    contact_title: "Contact Us",
    contact_content: "If you have any questions about these Terms of Service or Privacy Policy, please contact us at support@walletsave.com.",
  },
};

export default translations;
