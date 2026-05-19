How to Login to Open edX
=========================

This comprehensive guide demonstrates the complete login process for Open edX, showcasing all the key user interface elements and interactions you'll encounter.

Getting Started
---------------

Before you begin the login process, make sure you have your account credentials ready. You'll need either your email address or username, along with your password.

What You'll Need
~~~~~~~~~~~~~~~~

To successfully complete this login tutorial, ensure you have:

- A valid Open edX account (if you don't have one, you'll need to register first)
- Your email address or username
- Your account password
- A modern web browser with JavaScript enabled
- Stable internet connection

Navigate to the Login Page
---------------------------

The first step is accessing the Open edX login page. You can reach this page in several ways:

- Click the "Sign In" button from the main Open edX website
- Navigate directly to the login URL
- Follow a login link from an email invitation
- Access it through a course enrollment link

.. code-block:: testdoc

   await loginPage.navigate();
   await testdoc.screenshot({
     title: "Login page loaded",
     description: "The Open edX login page is displayed with all necessary form elements"
   });

The login page provides a clean, professional interface designed for easy access to your learning environment.

Understanding the Login Form
-----------------------------

The login form is the central element of the page and contains all the fields you need to authenticate. Take a moment to familiarize yourself with its layout and components.

Form Components
~~~~~~~~~~~~~~~

The login form includes several important elements:

- **Email/Username field**: Where you enter your login identifier
- **Password field**: For your secure password entry
- **Sign In button**: To submit your credentials
- **Forgot Password link**: For password recovery if needed
- **Remember me option**: To stay logged in longer (if available)

.. code-block:: testdoc

   await expect(loginPage.emailInput).toBeVisible();

   // Check accessibility of login page
   await assertA11y(page, {
     warnOnly: true,
     report: true,
     reportName: 'login-page'
   }, testInfo);

   await testdoc.screenshot({
     title: "Login form overview",
     description: "Complete view of the login form showing all input fields and buttons",
     elementOnly: 'form[id="sign-in-form"]',
     padding: 25
   });

Enter Your Credentials
-----------------------

Now you'll provide your account information to authenticate with the system.

Step 1: Enter Your Email or Username
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Click on the email field and carefully enter your login identifier. This can be either the email address you used when registering or your chosen username.

.. code-block:: testdoc

   await testdoc.fill({
     selector: 'input[name="emailOrUsername"]',
     value: TEST_USERNAME,
     title: 'Enter your email or username',
     description: 'Type your login identifier in the email/username field',
     elementOnly: 'form[id="sign-in-form"]',
     padding: 30
   });

.. note::

   If you're unsure whether to use your email or username, try your email address first as it's the most commonly used identifier.

Step 2: Enter Your Password
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Next, click on the password field and enter your account password. Make sure to type it exactly as you created it, paying attention to capitalization and special characters.

.. code-block:: testdoc

   await testdoc.fill({
     selector: 'input[name="password"]',
     value: TEST_PASSWORD,
     title: 'Enter your password',
     description: 'Type your secure password in the password field',
     elementOnly: 'form[id="sign-in-form"]',
     padding: 30
   });

.. warning::

   Your password will appear as dots or asterisks for security. This prevents others from seeing your password if they're looking at your screen.

.. important::

   Passwords are case-sensitive, so make sure your Caps Lock key is in the correct position before typing.

Submit Your Login Information
------------------------------

With your credentials entered, you're ready to authenticate and access your account.

Click the Sign In Button
~~~~~~~~~~~~~~~~~~~~~~~~

Locate the "Sign In" button (usually prominently displayed) and click it to submit your login information to the server.

.. code-block:: testdoc

   await testdoc.click({
     selector: 'button[name="sign-in"]',
     title: 'Click the Sign In button',
     description: 'Submit your credentials by clicking the Sign In button',
     elementOnly: 'form[id="sign-in-form"]',
     padding: 20
   });

The system will now verify your credentials. This process typically takes just a few seconds.

Authentication Process
~~~~~~~~~~~~~~~~~~~~~~

During authentication, the system:

1. Verifies your email/username exists in the database
2. Checks that your password matches the stored hash
3. Validates your account status (active, not suspended, etc.)
4. Creates a secure session for your browser
5. Redirects you to your dashboard or intended destination

.. code-block:: testdoc

   // Wait for redirect away from login page
   await page.waitForURL(url => !url.pathname.includes('/authn/'), { timeout: 15000 });

   await testdoc.step({
     title: 'Authentication completed',
     description: 'Your credentials have been verified and you have been redirected',
     screenshot: false,
     skipNumber: true
   });

Welcome to Your Dashboard
--------------------------

Congratulations! You've successfully logged into your Open edX account. You should now see your personalized dashboard.

Dashboard Overview
~~~~~~~~~~~~~~~~~~

Your dashboard is the central hub for your learning experience. From here, you can:

- **View enrolled courses**: See all courses you're currently taking
- **Track progress**: Monitor your completion status and grades
- **Access account settings**: Update your profile and preferences
- **Explore new courses**: Browse the course catalog
- **View announcements**: Stay updated with important information
- **Manage notifications**: Control how you receive updates

.. code-block:: testdoc

   await testdoc.screenshot({
     title: "Dashboard successfully loaded",
     description: "Your personalized Open edX dashboard showing available courses and account options"
   });

   // Check accessibility of dashboard
   await assertA11y(page, {
     warnOnly: true,
     report: true,
     reportName: 'dashboard'
   }, testInfo);

Navigation Options
~~~~~~~~~~~~~~~~~~

From your dashboard, you can easily navigate to different sections:

- **My Courses**: Access your enrolled courses and continue learning
- **Discover New**: Browse available courses and programs
- **Account**: Manage your profile, settings, and preferences
- **Help**: Access support resources and documentation

Next Steps
~~~~~~~~~~

Now that you're logged in, you can:

1. **Continue your learning**: Resume where you left off in your courses
2. **Explore new content**: Browse additional courses that interest you
3. **Update your profile**: Add information to personalize your experience
4. **Connect with others**: Join discussions and interact with fellow learners
5. **Track your progress**: Review your achievements and course completion status

Troubleshooting Common Issues
------------------------------

If you encounter problems during login, here are some common solutions:

Forgot Your Password?
~~~~~~~~~~~~~~~~~~~~~

If you can't remember your password:

1. Click the "Forgot Password" link on the login page
2. Enter your email address
3. Check your email for reset instructions
4. Follow the link to create a new password

Account Locked or Suspended?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If your account is locked:

- Contact your institution's support team
- Provide your username/email for assistance
- Be prepared to verify your identity

Browser Issues?
~~~~~~~~~~~~~~~

Try these steps if the page isn't working correctly:

- Clear your browser cache and cookies
- Disable browser extensions temporarily
- Try using an incognito/private browsing window
- Update your browser to the latest version

Accessibility Testing
---------------------

Throughout this login process, we verify that the interface meets accessibility standards to ensure all users can successfully authenticate, regardless of their abilities.

What We Test
~~~~~~~~~~~~

Our automated accessibility tests check for:

- **Color Contrast**: Text and background colors meet WCAG AA standards
- **Keyboard Navigation**: All interactive elements are accessible via keyboard
- **Screen Reader Support**: Proper labels and ARIA attributes for assistive technologies
- **Semantic HTML**: Correct use of landmarks and heading structure
- **Form Labels**: All input fields have associated labels

Running Accessibility Checks
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``assertA11y`` helper is automatically imported in documentation-driven tests. Use it at key points in your user flow.

Viewing Reports
~~~~~~~~~~~~~~~

After running tests, accessibility reports are generated at:

- ``artifacts/a11y-reports/index.html`` - Main dashboard
- Individual test reports with screenshots of violations

View reports with: ``npm run report:a11y``

Security Best Practices
-----------------------

To keep your account secure:

- **Use a strong password**: Combine letters, numbers, and special characters
- **Don't share credentials**: Keep your login information private
- **Log out when finished**: Especially on shared computers
- **Update regularly**: Change your password periodically
- **Monitor activity**: Review your account for unusual activity

You're now ready to make the most of your Open edX learning experience!

----

reStructuredText Formatting Examples
=====================================

This section demonstrates various reStructuredText formatting elements to ensure the parser handles them correctly.

Basic Text Formatting
---------------------

Here we show **bold text** and *italicized text* along with ``inline code`` examples.

   This is a block quote that provides important information about the login process.
   It can span multiple lines and provides emphasis for critical details.

Lists and Organization
----------------------

Ordered List Example
~~~~~~~~~~~~~~~~~~~~

1. First step in the process
2. Second step with detailed explanation
3. Third step that completes the workflow

Unordered List Example
~~~~~~~~~~~~~~~~~~~~~~

- Primary navigation option
- Secondary menu item
- Additional feature access

  - Nested sub-item
  - Another nested option

Code Examples
-------------

Here's an inline ``code snippet`` and a code block:

.. code-block:: json

   {
     "username": "student@example.com",
     "loginStatus": "authenticated",
     "sessionTimeout": 3600,
     "preferences": {
       "theme": "light",
       "notifications": true
     }
   }

Links and References
--------------------

Visit the `Open edX Documentation <https://docs.openedx.org>`_ for more information.

You can also reference internal sections like `Getting Started`_ above.

Tables
------

.. list-table:: Login Features
   :widths: 25 25 50
   :header-rows: 1

   * - Feature
     - Availability
     - Description
   * - Single Sign-On
     - ✅ Available
     - Login with external accounts
   * - Two-Factor Auth
     - ⚠️ Optional
     - Enhanced security feature
   * - Password Reset
     - ✅ Available
     - Self-service password recovery
   * - Account Lock
     - ✅ Available
     - Security protection mechanism

Admonitions
-----------

.. note::

   This is a note providing additional context.

.. tip::

   Pro tip: Always use strong passwords!

.. warning::

   Never share your password with anyone.

.. important::

   Remember to log out on shared computers.

.. caution::

   Be careful when entering passwords on public networks.

Definition Lists
----------------

Authentication
   The process of verifying user identity through credentials

Session Management
   Maintaining user state across multiple page requests

Two-Factor Authentication
   An extra layer of security requiring two forms of identification

Text Roles
----------

This text contains :strong:`strong emphasis` and :emphasis:`regular emphasis`.

You can also use :literal:`literal text` for code-like formatting.

Footnotes
---------

The login system uses industry-standard security protocols [#]_ to protect user data.

Advanced users can enable two-factor authentication [#]_ for additional security.

.. [#] Including OAuth 2.0, SAML, and encrypted session management
.. [#] Available through authenticator apps or SMS verification

Custom Anchor
-------------

.. _custom-login-section:

This section has a custom anchor that can be referenced directly in links.

----

**End of comprehensive reStructuredText formatting demonstration**
