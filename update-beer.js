const axios = require('axios');

async function sendBeerUpdate() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const DATASET_ID = "Dk8oGPhm0nC5dJdti";
    const CHAT_ID = "@beerpulsenews";

    try {
        // משיכת הנתונים - אנחנו מבקשים את הפריטים האחרונים שנוספו
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=5&desc=1&clean=1`;
        const response = await axios.get(apifyUrl);
        
        if (!response.data || response.data.length === 0) {
            console.log("No data found in dataset.");
            return;
        }

        // חיפוש הפריט הראשון ברשימה שהוא באמת פוסט ולא רק מידע על העמוד
        const post = response.data.find(item => item.type === 'post' || item.url.includes('posts') || item.text);

        if (!post) {
            console.log("No specific post found in the latest items.");
            return;
        }

        // חילוץ נתונים מדויק
        const breweryName = post.pageName || post.user || "מבשלה לא ידועה";
        const text = post.text || post.caption || "פוסט חדש עלה לעמוד!";
        
        // התיקון הקריטי ללינק: מחפשים את ה-URL של הפוסט הספציפי
        const postUrl = post.url || post.canonicalUrl || `https://www.facebook.com/${post.facebookId}/posts/${post.postId}`;

        const shortText = text.length > 800 ? text.substring(0, 800) + "..." : text;

        const message = `<b>🍺 עדכון מבשלה חדש 🍺</b>\n\n<b>מבשלה:</b> ${breweryName}\n\n${shortText}\n\n🔗 <a href="${postUrl}">לפוסט המלא בפייסבוק</a>`;

        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(telegramUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false 
        });

        console.log(`Success: Sent update for ${breweryName}`);

    } catch (error) {
        console.error("Error:", error.message);
    }
}

sendBeerUpdate();
