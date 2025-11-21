const comments = []; // Временное хранилище в памяти

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - получить все комментарии
  if (req.method === 'GET') {
    return res.json(comments);
  }

  // POST - добавить комментарий
  if (req.method === 'POST') {
    const { author, text } = req.body;
    
    if (!author || !text) {
      return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const newComment = {
      id: Date.now().toString(),
      author: author.trim(),
      text: text.trim(),
      date: new Date().toLocaleString('ru-RU')
    };

    comments.push(newComment);
    return res.status(201).json(newComment);
  }

  // DELETE - удалить все комментарии
  if (req.method === 'DELETE' && !req.query.id) {
    comments.length = 0;
    return res.json({ message: 'Все комментарии удалены' });
  }

  // DELETE - удалить конкретный комментарий
  if (req.method === 'DELETE' && req.query.id) {
    const index = comments.findIndex(c => c.id === req.query.id);
    if (index !== -1) {
      comments.splice(index, 1);
      return res.json({ message: 'Комментарий удален' });
    }
    return res.status(404).json({ error: 'Комментарий не найден' });
  }

  // Скачать комментарии
  if (req.method === 'GET' && req.query.download) {
    let txtContent = 'Комментарии с сайта\n';
    txtContent += '===================\n\n';
    
    comments.forEach((comment, index) => {
      txtContent += `Комментарий #${index + 1}:\n`;
      txtContent += `Автор: ${comment.author}\n`;
      txtContent += `Дата: ${comment.date}\n`;
      txtContent += `Текст: ${comment.text}\n`;
      txtContent += '─'.repeat(50) + '\n\n';
    });
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="comments.txt"');
    return res.send(txtContent);
  }

  // Авторизация администратора
  if (req.method === 'POST' && req.query.login) {
    const { password } = req.body;
    const ADMIN_PASSWORD = "admin123";
    
    if (password === ADMIN_PASSWORD) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: 'Неверный пароль' });
    }
  }

  return res.status(405).json({ error: 'Метод не поддерживается' });
}