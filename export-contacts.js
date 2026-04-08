const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

/**
 * WhatsApp Contact Exporter
 * Exports members of a group to a CSV file.
 * 
 * Usage: node export-contacts.js "Group Name"
 */

const groupName = process.argv[2];

if (!groupName) {
    console.error('Error: Please provide a group name.');
    console.log('Usage: node export-contacts.js "Group Name"');
    process.exit(1);
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('Scan this QR code with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('Client is ready! Waiting 5 seconds for background synchronization...');
    // Give the client some time to sync contacts and pushnames
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        const chats = await client.getChats();
        const group = chats.find(chat => chat.isGroup && chat.name === groupName);

        if (!group) {
            console.error(`Error: Group "${groupName}" not found.`);
            console.log('Available groups:');
            chats.filter(c => c.isGroup).forEach(c => console.log(` - ${c.name}`));
            process.exit(1);
        }

        console.log(`Found group: ${group.name}. Fetching participants...`);
        
        // Detailed participants fetch
        const participants = group.groupMetadata.participants;
        
        // CSV Header with semicolon separator and quoted headers
        let csvContent = '"Phone";"Saved Name";"Public Name";"Short Name";"Is Admin";"Is Super Admin"\n';
        
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];
            const participantId = participant.id._serialized;
            const phone = participant.id.user;

            let contact = await client.getContactById(participantId);
            
            // If name/pushname is missing, try a small retry/refresh strategy
            if (!contact.name && !contact.pushname) {
                // Try to "ping" the contact to force a sync
                try { await contact.getAbout(); } catch(e) {}
                await new Promise(resolve => setTimeout(resolve, 300));
                contact = await client.getContactById(participantId);
            }
            
            // Name fields
            const savedName = contact.name || '';
            const publicName = contact.pushname || '';
            const shortName = contact.shortName || '';
            
            const isAdmin = participant.isAdmin ? 'Yes' : 'No';
            const isSuperAdmin = participant.isSuperAdmin ? 'Yes' : 'No';
            
            // Clean names for CSV (escaping quotes and ensuring they are strings)
            const cleanSavedName = (savedName || '').toString().replace(/"/g, '""');
            const cleanPublicName = (publicName || '').toString().replace(/"/g, '""');
            const cleanShortName = (shortName || '').toString().replace(/"/g, '""');
            
            // Build row with semicolon separator
            csvContent += `"${phone}";"${cleanSavedName}";"${cleanPublicName}";"${cleanShortName}";"${isAdmin}";"${isSuperAdmin}"\n`;

            if ((i + 1) % 10 === 0 || i === participants.length - 1) {
                console.log(`Processed ${i + 1}/${participants.length} contacts...`);
            }
            
            // Prevent too rapid requests
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const fileName = `${groupName.replace(/[^a-z0-9]/gi, '_')}_contacts.csv`;
        fs.writeFileSync(fileName, csvContent);
        
        console.log(`Successfully exported ${participants.length} contacts to ${fileName}`);
        process.exit(0);

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
});

client.initialize();
