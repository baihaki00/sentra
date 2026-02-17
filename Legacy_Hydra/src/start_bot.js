const SentraCore = require('./core');
const TelegramInterface = require('./server/TelegramInterface');
require('dotenv').config();

async function startBot() {
    console.log('--- Sentra Telegram Bot ---');

    // Check config
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.error('❌ Error: TELEGRAM_BOT_TOKEN is missing in .env file.');
        console.error('Please create a .env file with your token.');
        process.exit(1);
    }

    const sentra = new SentraCore();
    await sentra.initialize();

    const telegram = new TelegramInterface(sentra.agent);

    // Attach memory stats to agent context for fun?
    // sentra.agent.context.interface = 'telegram';

    await telegram.start();

    console.log('Bot is running. Press Ctrl+C to stop.');

    // Keep alive
    process.on('SIGINT', async () => {
        console.log('\nStopping bot...');
        await telegram.stop();
        process.exit(0);
    });
}

startBot().catch(error => {
    console.error('Fatal Error:', error);
    process.exit(1);
});
