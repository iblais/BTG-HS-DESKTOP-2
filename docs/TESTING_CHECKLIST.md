# BTG Platform Testing Checklist

## Pre-Release Testing Guide

**Live URL:** https://btg-desktop.vercel.app

---

## 1. Database Setup (Run in Supabase SQL Editor)

Before testing, ensure all migrations are run:

1. Run `docs/migrations/006_complete_schema.sql`
2. Run `scripts/verify-schema.sql` to confirm tables exist

Expected tables:
- [x] programs
- [x] enrollments
- [x] modules (170 total: HS=90, COLLEGE=80)
- [x] teachers
- [x] classes
- [x] class_enrollments
- [x] assignments
- [x] grading_rubrics
- [x] user_preferences
- [x] week_unlocks
- [x] feature_flags (14 flags)

---

## 2. Student Flow Testing

### Authentication
- [ ] New user can sign up with email/password
- [ ] Existing user can sign in
- [ ] Password reset flow works
- [ ] Sign out clears local state

### Program Selection
- [ ] After login, user sees program selection (if no enrollment)
- [ ] High School Program shows 18 weeks
- [ ] College Program shows 16 weeks
- [ ] Beginner/Advanced track levels available
- [ ] English/Spanish language selection works
- [ ] "Start Learning" creates enrollment

### Dashboard
- [ ] Dashboard shows after enrollment
- [ ] XP, Level, Streak displayed
- [ ] "Continue Learning" button works
- [ ] Week progress summary accurate

### Courses
- [ ] All weeks display for selected program
- [ ] Week 1 is unlocked by default
- [ ] Weeks 2+ show as "Locked" initially
- [ ] Locked weeks show lock icon and can't be clicked
- [ ] Clicking unlocked week opens week modal
- [ ] "Start Lesson" opens LessonScreen
- [ ] "Friday Quiz" only available after completing lessons (80%+ progress)

### Lessons
- [ ] Lesson content displays correctly
- [ ] Section navigation works
- [ ] "Next Section" advances content
- [ ] Progress bar updates
- [ ] "Complete Lesson" marks progress

### Quiz
- [ ] Quiz starts with 10 questions
- [ ] Timer works (10 minutes)
- [ ] Answer selection works
- [ ] Submit grades quiz
- [ ] 70% required to pass
- [ ] Passing quiz unlocks next week
- [ ] Retake available for failed attempts
- [ ] Unlimited retakes allowed

### Profile
- [ ] Profile displays user info
- [ ] XP/Level/Streak stats shown
- [ ] Program details shown
- [ ] "Edit Profile" opens settings
- [ ] "Account Settings" works
- [ ] "Clear Cache" clears data
- [ ] "Reset Onboarding" resets program
- [ ] "Sign Out" logs out

---

## 3. Teacher Flow Testing

### Teacher Dashboard
- [ ] Teacher can access dashboard
- [ ] Classes list displays
- [ ] Class join codes shown
- [ ] Student count accurate
- [ ] Pending assignments queue works
- [ ] Quick grading buttons work (Full/Half/None)

### Grading
- [ ] AI grading runs on submission
- [ ] Teacher override works
- [ ] Feedback saved correctly

---

## 4. Language Testing

### Spanish Mode
- [ ] Select "Español" during enrollment
- [ ] UI labels in Spanish
- [ ] Language persists after refresh
- [ ] Can switch language in settings

---

## 5. Mobile Testing

- [ ] Responsive layout on iPhone/Android
- [ ] Bottom navigation works
- [ ] Touch interactions smooth
- [ ] Modals scroll properly
- [ ] Quiz works on mobile

---

## 6. Feature Flags

Test each feature flag is working:

| Flag | Expected Behavior |
|------|-------------------|
| fridayQuizOnly | Quiz only available after completing Mon-Thu |
| removeIntermediate | Only Beginner/Advanced shown |
| teacherDashboard | Teacher portal accessible |
| aiGrading | AI grades assignments |
| spanishContent | Spanish content available |
| gamification | XP/Levels/Streaks active |

---

## 7. Error Scenarios

- [ ] No network: Shows offline message
- [ ] Invalid login: Shows error
- [ ] Failed enrollment: Shows retry option
- [ ] Quiz timeout: Auto-submits

---

## 8. Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

---

## 9. Performance

- [ ] Initial load < 3 seconds
- [ ] Page transitions smooth
- [ ] No console errors
- [ ] PWA installs correctly

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | | | |
| QA | | | |
| Product | | | |

---

## Notes

Add any issues found during testing here:

1.
2.
3.
