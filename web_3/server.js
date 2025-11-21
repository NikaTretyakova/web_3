const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const COMMENTS_FILE = 'comments.txt';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Функции для работы с текстовым файлом
async function loadComments() {
    try {
        const data = await fs.readFile(COMMENTS_FILE, 'utf8');
        if (!data.trim()) return [];
        
        const lines = data.trim().split('\n');
        const comments = [];
        
        for (let i = 0; i < lines.length; i += 4) {
            if (lines[i].startsWith('ID:')) {
                comments.push({
                    id: lines[i].replace('ID:', '').trim(),
                    author: lines[i + 1].replace('Автор:', '').trim(),
                    text: lines[i + 2].replace('Текст:', '').trim(),
                    date: lines[i + 3].replace('Дата:', '').trim()
                });
            }
        }
        
        return comments;
    } catch (error) {
        // Если файла нет, создаем пустой
        await fs.writeFile(COMMENTS_FILE, '');
        return [];
    }
}

async function saveComments(comments) {
    let content = '';
    comments.forEach(comment => {
        content += `ID: ${comment.id}\n`;
        content += `Автор: ${comment.author}\n`;
        content += `Текст: ${comment.text}\n`;
        content += `Дата: ${comment.date}\n`;
        content += '---\n';
    });
    
    await fs.writeFile(COMMENTS_FILE, content);
}

// API Routes

// Получить все комментарии
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await loadComments();
        res.json(comments);
    } catch (error) {
        console.error('Ошибка загрузки комментариев:', error);
        res.status(500).json({ error: 'Ошибка загрузки комментариев' });
    }
});

// Добавить комментарий
app.post('/api/comments', async (req, res) => {
    try {
        const { author, text } = req.body;
        
        if (!author || !text) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        const comments = await loadComments();
        const newComment = {
            id: Date.now().toString(),
            author: author.trim(),
            text: text.trim(),
            date: new Date().toLocaleString('ru-RU')
        };

        comments.push(newComment);
        await saveComments(comments);
        
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Ошибка сохранения комментария:', error);
        res.status(500).json({ error: 'Ошибка сохранения комментария' });
    }
});

// Удалить комментарий
app.delete('/api/comments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await loadComments();
        const filteredComments = comments.filter(comment => comment.id !== id);
        
        await saveComments(filteredComments);
        res.json({ message: 'Комментарий удален' });
    } catch (error) {
        console.error('Ошибка удаления комментария:', error);
        res.status(500).json({ error: 'Ошибка удаления комментария' });
    }
});

// Удалить все комментарии
app.delete('/api/comments', async (req, res) => {
    try {
        await saveComments([]);
        res.json({ message: 'Все комментарии удалены' });
    } catch (error) {
        console.error('Ошибка удаления комментариев:', error);
        res.status(500).json({ error: 'Ошибка удаления комментариев' });
    }
});

// Скачать комментарии в TXT
app.get('/api/comments/download', async (req, res) => {
    try {
        const data = await fs.readFile(COMMENTS_FILE, 'utf8');
        const filename = `comments_${new Date().toISOString().split('T')[0]}.txt`;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        res.status(500).json({ error: 'Ошибка создания файла' });
    }
});

// Проверка пароля администратора
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = "admin123";
    
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Неверный пароль' });
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`📝 Комментарии сохраняются в файл: ${COMMENTS_FILE}`);
});