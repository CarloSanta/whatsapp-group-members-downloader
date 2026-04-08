const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

const targetNumber = '393454297421@c.us';

client.on('ready', async () => {
    console.log('Client is ready! Waiting 10 seconds for a deep sync...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
        console.log(`Attempting to retrieve all details for ${targetNumber}...`);
        const contact = await client.getContactById(targetNumber);
        
        // Force various sync actions
        try { await contact.getAbout(); } catch(e) {}
        try { await contact.getProfilePicUrl(); } catch(e) {}
        try { await contact.getFormattedNumber(); } catch(e) {}

        console.log('\n--- RAW CONTACT DATA ---');
        console.log(`ID: ${contact.id._serialized}`);
        console.log(`Number: ${contact.number}`);
        console.log(`Name (Saved): ${contact.name || 'NOT_FOUND'}`);
        console.log(`Pushname (Public): ${contact.pushname || 'NOT_FOUND'}`);
        console.log(`Short Name: ${contact.shortName || 'NOT_FOUND'}`);
        console.log(`Is Group: ${contact.isGroup}`);
        console.log(`Is User: ${contact.isUser}`);
        console.log(`Is Enterprise: ${contact.isEnterprise}`);
        console.log(`Is Contact: ${contact.isMyContact}`);
        console.log(`Is Blocked: ${contact.isBlocked}`);
        
        // Check if there are any other hidden fields
        const keys = Object.keys(contact);
        console.log('\n--- AVAILABLE PROPERTY KEYS ---');
        console.log(keys.join(', '));
        console.log('------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error fetching contact:', error);
        process.exit(1);
    }
});

client.initialize();
