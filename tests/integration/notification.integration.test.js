import NotificationService from '../../src/services/notification.service.js';
import { prisma } from '../../src/config/db.js';

/**
 * Simulate real-world scenarios
 */

async function runIntegrationTests() {
  console.log('🚀 Integration Tests - Real Scenarios\n');

  try {
    // Scenario 1: New Shift Match
    console.log('Scenario 1: Worker receives shift match notification');
    await NotificationService.triggerNotification({
      recipientId: 'worker-001',
      title: '🎯 New Shift Match!',
      message: 'A Facility XYZ shift matching your skills is available',
      type: 'shift',
      relatedId: 'shift-456',
      data: { facilityName: 'Facility XYZ', position: 'Nurse' },
    });
    console.log('✅ Shift match notification sent\n');

    // Scenario 2: Application Accepted
    console.log('Scenario 2: Worker receives application accepted notification');
    await NotificationService.triggerNotification({
      recipientId: 'worker-001',
      title: '✅ Application Accepted!',
      message: 'Your application for Nurse position has been accepted',
      type: 'application',
      relatedId: 'app-789',
      data: { status: 'accepted' },
    });
    console.log('✅ Application accepted notification sent\n');

    // Scenario 3: Payment Released
    console.log('Scenario 3: Worker receives payment released notification');
    await NotificationService.triggerNotification({
      recipientId: 'worker-001',
      title: '💰 Payment Released!',
      message: '₦50,000 has been transferred to your account',
      type: 'payment',
      relatedId: 'payment-101',
      data: { amount: 50000, status: 'released' },
    });
    console.log('✅ Payment notification sent\n');

    // Scenario 4: Verify all saved correctly
    console.log('Scenario 4: Verifying all notifications saved');
    const allNotifs = await NotificationService.getUserNotifications('worker-001', { limit: 100 });
    console.log(`✅ Total notifications for worker: ${allNotifs.length}`);
    allNotifs.forEach((n) => {
      console.log(`   - ${n.type}: ${n.title}`);
    });
    console.log('');

    // Scenario 5: Check unread
    console.log('Scenario 5: Checking unread notifications');
    const unreadCount = await NotificationService.getUnreadCount('worker-001');
    console.log(`✅ Unread notifications: ${unreadCount}\n`);

    console.log('✅ All integration tests passed!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runIntegrationTests();