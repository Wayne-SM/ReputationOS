import crypto from 'crypto';
import { db, verifyConnection, pool } from './index.js';
import {
  users,
  businesses,
  businessMembers,
  businessSettings,
  googleReviewSettings,
  reviewSources,
  qrCodes,
  feedback,
  analyticsEvents,
} from './schema.js';
import { hashPassword } from '../services/auth.service.js';

async function seed() {
  console.log('🌱 Starting database seed...');

  const connected = await verifyConnection();
  if (!connected) {
    console.error('❌ Cannot seed: database connection failed. Make sure PostgreSQL is running.');
    process.exit(1);
  }

  try {
    // 1. Create Demo User
    const passwordHash = await hashPassword('Password123!');
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@reputationos.com',
        name: 'Alex Rivera',
        passwordHash,
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!demoUser) {
      console.log('ℹ️ Demo user already exists. Skipping seed.');
      await pool.end();
      return;
    }

    console.log('✓ Created demo user: demo@reputationos.com');

    // 2. Create Demo Business
    const [demoBusiness] = await db
      .insert(businesses)
      .values({
        name: 'The Daily Grind Artisan Cafe',
        slug: 'daily-grind',
        description: 'Specialty coffee and artisan pastries crafted locally with care.',
        accentColor: '#2563eb',
        phone: '+1 (555) 234-5678',
        email: 'hello@dailygrind.coffee',
        address: '124 Market Street, Suite A, San Francisco, CA 94103',
        website: 'https://dailygrind.coffee',
      })
      .returning();

    console.log(`✓ Created demo business: ${demoBusiness!.name} (slug: ${demoBusiness!.slug})`);

    // 3. Create Business Membership
    await db.insert(businessMembers).values({
      userId: demoUser.id,
      businessId: demoBusiness!.id,
      role: 'owner',
    });

    // 4. Create Business Settings
    await db.insert(businessSettings).values({
      businessId: demoBusiness!.id,
      feedbackWelcomeText: 'How was your experience today at The Daily Grind?',
      feedbackThankYouText: 'Thank you for helping us craft better coffee and experiences!',
      googleReviewCtaText: 'Share your experience on Google',
      collectContactInfo: true,
      contactInfoRequired: false,
    });

    // 5. Create Google Review Settings
    await db.insert(googleReviewSettings).values({
      businessId: demoBusiness!.id,
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
      googleRating: '4.8',
      googleReviewCount: 142,
    });

    // 6. Create Review Sources
    const [receptionSource] = await db
      .insert(reviewSources)
      .values({
        businessId: demoBusiness!.id,
        type: 'reception',
        label: 'Reception Counter QR',
        url: `http://localhost:5173/r/${demoBusiness!.slug}?source=reception`,
      })
      .returning();

    await db
      .insert(reviewSources)
      .values({
        businessId: demoBusiness!.id,
        type: 'instagram',
        label: 'Instagram Bio Link',
        url: `http://localhost:5173/r/${demoBusiness!.slug}?source=instagram`,
      });

    // 7. Create QR Code Record
    await db.insert(qrCodes).values({
      sourceId: receptionSource!.id,
      businessId: demoBusiness!.id,
      qrData: receptionSource!.url!,
      styleConfig: { errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } },
    });

    // 8. Create Sample Feedbacks
    const sampleFeedbacks = [
      {
        rating: 5,
        text: 'The cold brew and almond croissant are unmatched! Amazing staff and friendly vibe.',
        sourceType: 'reception',
        customerName: 'Marcus Chen',
        googleReviewClicked: true,
      },
      {
        rating: 5,
        text: 'Best espresso in the neighborhood. Love coming here to work in the mornings.',
        sourceType: 'instagram',
        customerName: 'Sarah Jenkins',
        googleReviewClicked: true,
      },
      {
        rating: 4,
        text: 'Great coffee, seating was a little crowded around 10am but overall wonderful experience.',
        sourceType: 'reception',
        customerName: 'David Miller',
        googleReviewClicked: true,
      },
      {
        rating: 3,
        text: 'Coffee is great, but waited about 15 minutes during the rush. Staff was apologetic though.',
        sourceType: 'reception',
        customerName: null,
        googleReviewClicked: false,
      },
      {
        rating: 5,
        text: 'Visited after seeing your Instagram reels. The seasonal vanilla cardamom latte was incredible!',
        sourceType: 'instagram',
        customerName: 'Emily Watson',
        googleReviewClicked: true,
      },
    ];

    for (const fb of sampleFeedbacks) {
      await db.insert(feedback).values({
        businessId: demoBusiness!.id,
        sourceType: fb.sourceType,
        sessionId: crypto.randomUUID(),
        rating: fb.rating,
        text: fb.text,
        customerName: fb.customerName,
        googleReviewClicked: fb.googleReviewClicked,
        isRead: false,
      });
    }

    console.log(`✓ Inserted ${sampleFeedbacks.length} sample feedback entries`);

    // 9. Sample Analytics Events
    const events = [
      { type: 'feedback_page_view', source: 'reception' },
      { type: 'feedback_page_view', source: 'reception' },
      { type: 'feedback_page_view', source: 'instagram' },
      { type: 'rating_selected', source: 'reception' },
      { type: 'feedback_submitted', source: 'reception' },
      { type: 'google_review_clicked', source: 'reception' },
    ];

    for (const ev of events) {
      await db.insert(analyticsEvents).values({
        businessId: demoBusiness!.id,
        eventType: ev.type,
        sourceType: ev.source,
        sessionId: crypto.randomUUID(),
      });
    }

    console.log(`✓ Inserted ${events.length} sample analytics events`);
    console.log('\n🎉 Database seed completed successfully!');
    console.log('Login credentials:');
    console.log('  Email:    demo@reputationos.com');
    console.log('  Password: Password123!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();
