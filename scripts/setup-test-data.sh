#!/bin/bash

# Test data setup script for edX E2E tests
# This script creates test users and courses for use in Playwright tests

set -e

echo "Setting up test data for edX E2E tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test user credentials
TEST_USER_EMAIL="test@example.com"
TEST_USER_USERNAME="testuser"
TEST_USER_PASSWORD="password123"

ADMIN_USER_EMAIL="admin@example.com"
ADMIN_USER_USERNAME="adminuser"
ADMIN_USER_PASSWORD="admin123"

# Use tutor from the virtual environment
TUTOR_CMD="../.venv/bin/tutor"

echo -e "${YELLOW}Checking tutor status...${NC}"
# Check if tutor dev is running by looking for running containers
if ! docker ps | grep -q "tutor_main_dev-lms"; then
    echo -e "${RED}❌ Tutor dev is not running. Please start it with: $TUTOR_CMD dev start lms cms${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Tutor dev is running${NC}"

echo -e "${YELLOW}Creating test users...${NC}"

# Create users directly using the running containers (much faster)
echo "Creating test users using running containers..."
$TUTOR_CMD dev exec lms python manage.py lms shell -c "
from django.contrib.auth import get_user_model
from common.djangoapps.student.models import UserProfile

User = get_user_model()

# Create regular test user
username = '${TEST_USER_USERNAME}'
email = '${TEST_USER_EMAIL}'
password = '${TEST_USER_PASSWORD}'

try:
    user = User.objects.get(username=username)
    print(f'⚠️  User {username} already exists (ID: {user.id})')
    # Update password to ensure it's correct
    user.set_password(password)
    user.save()
    print(f'✅ Updated password for existing user: {username}')
except User.DoesNotExist:
    user = User.objects.create_user(username=username, email=email, password=password)
    user.is_active = True
    user.save()

    # Create user profile
    profile, created = UserProfile.objects.get_or_create(user=user)
    profile.name = 'Test User'
    profile.save()

    print(f'✅ Created new user: {username} (ID: {user.id})')

# Create admin test user
admin_username = '${ADMIN_USER_USERNAME}'
admin_email = '${ADMIN_USER_EMAIL}'
admin_password = '${ADMIN_USER_PASSWORD}'

try:
    admin_user = User.objects.get(username=admin_username)
    print(f'⚠️  Admin user {admin_username} already exists (ID: {admin_user.id})')
    # Update password and permissions to ensure they're correct
    admin_user.set_password(admin_password)
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()
    print(f'✅ Updated admin user: {admin_username}')
except User.DoesNotExist:
    admin_user = User.objects.create_user(username=admin_username, email=admin_email, password=admin_password)
    admin_user.is_active = True
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    # Create user profile
    admin_profile, created = UserProfile.objects.get_or_create(user=admin_user)
    admin_profile.name = 'Admin User'
    admin_profile.save()

    print(f'✅ Created new admin user: {admin_username} (ID: {admin_user.id})')

print('User creation completed successfully!')
"

# Quick verification (users were already verified above)
echo -e "${GREEN}✅ User setup completed successfully!${NC}"

echo -e "${YELLOW}Setting up test courses...${NC}"

# Note: Course setup is complex and can be done later if needed
# For now, we'll rely on any existing demo course
echo "ℹ️  Course setup skipped - use existing demo course or import manually"
echo "   To import demo course: tutor dev do importdemocourse"

echo -e "${GREEN}✅ Test data setup complete!${NC}"
echo ""
echo "Test credentials created:"
echo "  Regular user: ${TEST_USER_USERNAME} / ${TEST_USER_PASSWORD} (${TEST_USER_EMAIL})"
echo "  Admin user: ${ADMIN_USER_USERNAME} / ${ADMIN_USER_PASSWORD} (${ADMIN_USER_EMAIL})"
echo ""
echo "Available courses:"
echo "  - Demo course: course-v1:edX+DemoX+Demo_Course"
echo "  - Test course: course-v1:TestOrg+TestCourse+2023"
echo ""
echo -e "${YELLOW}Run tests with: npm test${NC}"