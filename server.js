const express = require('express');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Безпечна конфігурація через змінні оточення Render
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Налаштування транзитного сховища Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'family_archive',
        resource_type: 'auto', // Авто-визначення: фото чи відео
    },
});

const upload = multer({ storage });

// Роздача статичних файлів з папки public
app.use(express.static('public'));

// Маршрут для завантаження медіафайлів
app.post('/upload', upload.array('media'), (req, res) => {
    res.redirect('/');
});

// Маршрут для отримання списку медіа з групуванням по роках
app.get('/api/media', async (req, res) => {
    try {
        // Запитуємо файли з хмари разом із метаданими EXIF
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'family_archive/',
            max_results: 500,
            image_metadata: true 
        });

        const grouped = {};

        result.resources.forEach(file => {
            // Шукаємо оригінальну дату зйомки в EXIF, якщо немає — беремо дату завантаження
            let dateStr = file.image_metadata?.DateTimeOriginal || file.created_at;
            let year = new Date(dateStr).getFullYear();

            if (!grouped[year]) {
                grouped[year] = [];
            }

            grouped[year].push({
                url: file.secure_url,
                type: file.resource_type === 'video' ? 'video' : 'photo',
                year: year
            });
        });

        res.json(grouped);
    } catch (error) {
        console.error('Помилка Cloudinary:', error);
        res.status(500).json({ error: 'Не вдалося завантажити медіафайли з хмари' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер успішно запущено на порту ${PORT}`);
});
