const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

/**
 * WhatsApp Contact Exporter
 * Exports members of a group to a CSV file.
 * 
 * Usage: node export-contacts.js "Group Name"
 */

const OPERATION_TIMEOUT_MS = 15000;
const CSV_HEADER = '"Phone";"Saved Name";"Public Name";"Short Name";"Is Admin";"Is Super Admin"\r\n';

function withTimeout(promise, timeoutMs, description) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(
            `Timeout after ${Math.round(timeoutMs / 1000)}s: ${description}`
        )), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function escapeCsv(value) {
    return String(value ?? '').replace(/"/g, '""');
}

function buildCsvRow(participant) {
    const fields = [participant.phone, participant.savedName, participant.publicName,
        participant.shortName, participant.isAdmin ? 'Yes' : 'No',
        participant.isSuperAdmin ? 'Yes' : 'No'];
    return `${fields.map(value => `"${escapeCsv(value)}"`).join(';')}\r\n`;
}

// getChats() refreshes every group's metadata; one failed request blocks all.
async function getLocalGroups(client) {
    return withTimeout(client.pupPage.evaluate(() => window.Store.Chat.getModelsArray()
        .filter(chat => Boolean(chat.groupMetadata))
        .map(chat => ({
            id: chat.id?._serialized || '',
            name: chat.formattedTitle || chat.name || ''
        }))), OPERATION_TIMEOUT_MS, 'reading the group list');
}

// Use local contacts: getContactById() performs a remote profile request.
async function getLocalParticipants(client, groupId) {
    return withTimeout(client.pupPage.evaluate(async (targetGroupId) => {
        let chat = window.Store.Chat.get(targetGroupId);
        let collection = chat?.groupMetadata?.participants;
        let models = collection?.getModelsArray?.() || collection?._models || [];

        // Refresh only the requested group when its local participant list is empty.
        if (models.length === 0) {
            await window.Store.GroupQueryAndUpdate({ id: targetGroupId });
            chat = window.Store.Chat.get(targetGroupId);
            collection = chat?.groupMetadata?.participants;
            models = collection?.getModelsArray?.() || collection?._models || [];
        }

        return models.map(participant => {
            const id = participant.id;
            const contact = participant.contact || window.Store.Contact.get(id?._serialized);
            let phoneWid = contact?.phoneNumber;
            if (!phoneWid && id?.server !== 'lid') phoneWid = id;

            let contactData = {};
            if (contact) {
                try {
                    contactData = window.WWebJS.getContactModel(contact);
                } catch (_) {
                    contactData = contact.serialize?.() || {};
                }
            }

            return {
                phone: phoneWid?.user || contactData.userid || '',
                unresolvedId: id?._serialized || '',
                savedName: contactData.name || '',
                publicName: contactData.pushname || '',
                shortName: contactData.shortName || '',
                isAdmin: Boolean(participant.isAdmin),
                isSuperAdmin: Boolean(participant.isSuperAdmin)
            };
        });
    }, groupId), OPERATION_TIMEOUT_MS, 'reading the group participants');
}

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

client.on('authenticated', () => console.log('Authentication successful. Loading WhatsApp data...'));
client.on('loading_screen', (percent, message) => console.log(`Loading WhatsApp: ${percent}% ${message || ''}`.trim()));
client.on('auth_failure', message => console.error(`Authentication failed: ${message}`));
client.on('disconnected', reason => console.error(`WhatsApp disconnected: ${reason}`));

client.once('ready', async () => {
    console.log('Client is ready. Reading the locally loaded groups...');
    try {
        const groups = await getLocalGroups(client);
        const group = groups.find(chat => chat.name === groupName);

        if (!group) {
            console.error(`Error: Group "${groupName}" not found.`);
            console.log('Available groups:');
            groups.forEach(chat => console.log(` - ${chat.name}`));
            process.exit(1);
        }

        console.log(`Found group: ${group.name}. Reading participants...`);
        const participants = await getLocalParticipants(client, group.id);

        if (participants.length === 0) {
            throw new Error('No participants are loaded for this group. Open the group once in WhatsApp Web and retry.');
        }

        const fileName = `${groupName.replace(/[^a-z0-9]/gi, '_')}_contacts.csv`;
        const outputPath = path.resolve(process.cwd(), fileName);
        fs.writeFileSync(outputPath, CSV_HEADER, 'utf8');

        let unresolvedPhones = 0;
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];
            if (!participant.phone) {
                unresolvedPhones++;
                console.warn(`Warning: phone number unavailable for ${participant.unresolvedId || `participant ${i + 1}`}.`);
            }

            fs.appendFileSync(outputPath, buildCsvRow(participant), 'utf8');
            console.log(`Processed ${i + 1}/${participants.length} contacts...`);
        }

        console.log(`Successfully exported ${participants.length} contacts to ${outputPath}`);
        if (unresolvedPhones > 0) {
            console.warn(`${unresolvedPhones} phone number(s) were hidden or not yet resolved by WhatsApp and were left blank.`);
        }
        process.exit(0);

    } catch (error) {
        console.error(`Export failed: ${error.stack || error.message || error}`);
        process.exit(1);
    }
});

console.log('Starting WhatsApp Web...');
client.initialize().catch(error => {
    console.error(`Unable to start WhatsApp Web: ${error.stack || error.message || error}`);
    process.exit(1);
});
