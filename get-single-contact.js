const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

const targetNumber = '393383384804@c.us';

client.on('ready', async () => {
    console.log('Client is ready! Fetching contact info...');

    try {
        const contact = await client.getContactById(targetNumber);
        
        console.log('Fetching extra info to force sync...');
        try { await contact.getAbout(); } catch(e) {}
        try { await contact.getProfilePicUrl(); } catch(e) {}
        
        // Fetch again after "sync"
        const refreshedContact = await client.getContactById(targetNumber);

        console.log('--- CONTACT DETAILS ---');
        console.log(`ID: ${refreshedContact.id._serialized}`);
        console.log(`Number: ${refreshedContact.number}`);
        console.log(`Saved Name (contact.name): ${refreshedContact.name || 'EMPTY'}`);
        console.log(`Public Name (contact.pushname): ${refreshedContact.pushname || 'EMPTY'}`);
        console.log(`Short Name (contact.shortName): ${refreshedContact.shortName || 'EMPTY'}`);
        console.log('------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error fetching contact:', error);
        process.exit(1);
    }
});

client.initialize();
