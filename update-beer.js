const axios = require('axios');

async function updateBeerPulse() {
    const { APIFY_TOKEN, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, DATASET_ID } = process.env;

    try {
        // 1. משיכת הנתונים מ-Apify (הפוסט האחרון בלבד)
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=1&desc=1`;
        const response = await axios.get(apifyUrl);
        const latestPost = response.data[0];

        if (!latestPost) {
            console.log("No posts found.");
            return;
        }

        // 2. הכנת הטקסט לטלגרם (חיתוך ועיצוב)
        const postText = latestPost.text ? latestPost.text.substring(0, 900) + '...' : 'פוסט חדש ללא טקסט';
        const postUrl = latestPost.url || '';
        const message = `<b>Beer Pulse Update</b>\n\n${postText}\n\n<a href="${postUrl}">לפוסט המלא בפייסבוק</a>`;

        // 3. שליחה ישירה לטלגרם
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(telegramUrl, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false
        });

        console.log("Successfully sent to Telegram!");

    } catch (error) {
        console.error("Error updating:", error.response ? error.response.data : error.message);
    }
}

updateBeerPulse();
