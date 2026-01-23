const axios = require('axios');

async function sendBeerUpdate() {
    const APIFY_TOKEN = process.env.APIFY_TOKEN;
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const DATASET_ID = "Dk8oGPhm0nC5dJdti"; // מזהה ה-Dataset מהתמונות שלך
    const CHAT_ID = "@beerpulsenews";

    try {
        // 1. משיכת הנתונים האחרונים מה-Dataset של Apify
        const apifyUrl = `https://api.apify.com/v2/datasets/${DATASET_ID}/items?token=${APIFY_TOKEN}&limit=1&desc=1`;
        const response = await axios.get(apifyUrl);
        
        if (!response.data || response.data.length === 0) {
            console.log("No new posts found.");
            return;
        }

        const post = response.data[0];

        // 2. חילוץ הטקסט והקישור הנכון (הוספנו בדיקה לכמה שדות אפשריים)
        const text = post.text || post.caption || post.fullText || "עדכון חדש ממבשלה!";
        const postUrl = post.url || post.facebookUrl || `https://www.facebook.com/${post.facebookId}/posts/${post.postId}`;

        // 3. חיתוך הטקסט כדי שלא יעבור את מגבלת טלגרם (1024 תווים)
        const shortText = text.length > 900 ? text.substring(0, 900) + "..." : text;

        // 4. בניית ההודעה בפורמט HTML
        const message = `<b>🍺 עדכון מבשלה חדש 🍺</b>\n\n${shortText}\n\n🔗 <a href="${postUrl}">לפוסט המלא בפייסבוק</a>`;

        // 5. שליחה לטלגרם
        const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(telegramUrl, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false // מוודא שטלגרם יציג תצוגה מקדימה של התמונה
        });

        console.log("Message sent successfully!");

    } catch (error) {
        console.error("Error running update:", error.message);
    }
}

sendBeerUpdate();
