const axios = require('axios');

async function sendBeerUpdate() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const DATASET_ID = "Dk8oGPhm0nC5dJdti";
    const CHAT_ID = "@beerpulsenews";

    try {
        // משיכת 10 פריטים כדי לוודא שאנחנו מוצאים פוסט אמיתי ולא רק פרופיל
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=10&desc=1&clean=1`;
        const response = await axios.get(apifyUrl);
        
        if (!response.data || response.data.length === 0) {
            console.log("Dataset is empty.");
            return;
        }

        // הדפסה ללוג כדי שנוכל לראות מה הגיע (עוזר לניפוי שגיאות)
        console.log("First item sample:", JSON.stringify(response.data[0], null, 2));

        // חיפוש פריט שיש לו URL של פוסט (מכיל /posts/ או /videos/ או /photos/)
        const post = response.data.find(item => 
            (item.url && (item.url.includes('posts') || item.url.includes('photos') || item.url.includes('videos'))) || 
            (item.text && item.text.length > 5)
        ) || response.data[0]; // אם לא מצאנו, ניקח את הראשון כברירת מחדל

        // חילוץ שם המבשלה משדות שונים
        const breweryName = post.pageName || post.user || post.userName || post.ownerName || "מבשלה";
        
        // חילוץ טקסט
        const rawText = post.text || post.caption || post.message || post.description || "עדכון חדש עלה!";
        
        // חילוץ לינק - סדר עדיפויות ללינק ספציפי
        const postUrl = post.url || post.link || post.facebookUrl || post.canonicalUrl;

        const shortText = rawText.length > 800 ? rawText.substring(0, 800) + "..." : rawText;

        const message = `<b>🍺 עדכון מבשלה חדש 🍺</b>\n\n<b>מבשלה:</b> ${breweryName}\n\n${shortText}\n\n🔗 <a href="${postUrl}">לפוסט המלא בפייסבוק</a>`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(telegramUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false 
        });

        console.log(`Successfully sent update for: ${breweryName}`);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

sendBeerUpdate();
