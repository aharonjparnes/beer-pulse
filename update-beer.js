const axios = require('axios');

async function sendBeerUpdate() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const DATASET_ID = "Dk8oGPhm0nC5dJdti";
    const CHAT_ID = "@beerpulsenews";

    try {
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=5&desc=1&clean=1`;
        const response = await axios.get(apifyUrl);
        
        if (!response.data || response.data.length === 0) {
            console.log("ה-Dataset ריק לגמרי ב-Apify.");
            return;
        }

        // הדפסה ללוג של ה-Actions כדי שנראה את המבנה האמיתי
        console.log("דגימת נתונים מ-Apify:", JSON.stringify(response.data[0], null, 2));

        // ניסיון לחלץ פוסט בצורה רחבה מאוד
        const post = response.data.find(item => item.text || item.caption || item.message || item.url || item.link);

        if (!post) {
            console.log("לא נמצא פריט עם טקסט או קישור. בודק שדות חלופיים...");
            return;
        }

        // חילוץ טקסט - בודק את כל האפשרויות של פייסבוק [cite: 2026-01-23]
        const rawText = post.text || post.caption || post.message || post.description || "עדכון חדש עלה!";
        const breweryName = post.pageName || post.user || post.ownerName || "מבשלה";
        
        // חילוץ לינק - מחפש לינק ישיר לפוסט [cite: 2026-01-23]
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

        console.log(`הודעה נשלחה בהצלחה עבור: ${breweryName}`);

    } catch (error) {
        console.error("שגיאה בהרצה:", error.message);
        if (error.response) console.log("פירוט שגיאה מטלגרם:", error.response.data);
    }
}

sendBeerUpdate();
