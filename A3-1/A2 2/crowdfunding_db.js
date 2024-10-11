const mysql = require('mysql');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json()); 


const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '12345678',
  database: 'crowdfunding_db',
});

app.get('/fundraisers', (req, res) => {
  const sql = 'SELECT * FROM fundraisers WHERE is_active = TRUE';
  connection.query(sql, (error, data) => {
    if (error) {
      console.error('Query error:', error);
      return res.status(500).json({ message: 'Error retrieving data' });
    }
    res.json(data);
  });
});


app.get('/search', (req, res) => {
  const { organizer, city, category } = req.query;
  let sql = 'SELECT * FROM fundraisers WHERE is_active = TRUE';
  let filters = [];

  if (organizer) {
    sql += ' AND organizer LIKE ?';
    filters.push(`%${organizer}%`);
  }

  if (city) {
    sql += ' AND city LIKE ?';
    filters.push(`%${city}%`);
  }

  if (category) {
    sql += ' AND category_id = ?';
    filters.push(category);
  }

  connection.query(sql, filters, (error, results) => {
    if (error) {
      console.error('Search query error:', error);
      return res.status(500).json({ message: 'Error processing search' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No matching fundraisers found' });
    }
    res.json(results);
  });
});

app.get('/fundraisers/:id', (req, res) => {
  const fundraiserId = req.params.id;

  const fundraiserSql = 'SELECT * FROM fundraisers WHERE fundraiser_id = ?';
  connection.query(fundraiserSql, [fundraiserId], (error, fundraiserResult) => {
    if (error) {
      console.error('Fundraiser query error:', error);
      return res.status(500).json({ message: 'Error retrieving fundraiser' });
    }

    if (fundraiserResult.length === 0) {
      return res.status(404).json({ message: 'Fundraiser not found' });
    }

    const donationsSql = 'SELECT * FROM donation WHERE fundraiser_id = ?';
    connection.query(donationsSql, [fundraiserId], (donationError, donationResult) => {
      if (donationError) {
        console.error('Donation query error:', donationError);
        return res.status(500).json({ message: 'Error retrieving donations' });
      }

      res.json({
        fundraiser: fundraiserResult[0],
        donations: donationResult
      });
    });
  });
});


app.post('/donations', (req, res) => {
  const { date, amount, giver, fundraiser_id } = req.body;

  const sql = 'INSERT INTO donation (date, amount, giver, fundraiser_id) VALUES (?, ?, ?, ?)';
  connection.query(sql, [date, amount, giver, fundraiser_id], (error, result) => {
    if (error) {
      console.error('Insert donation error:', error);
      return res.status(500).json({ message: 'Error adding donation' });
    }

    res.status(201).json({ message: 'Donation added successfully' });
  });
});


app.post('/fundraisers', (req, res) => {
  const { organizer, title, target_funding, city, category_id } = req.body;

  const sql = 'INSERT INTO fundraisers (organizer, title, target_funding, city, category_id) VALUES (?, ?, ?, ?, ?)';
  connection.query(sql, [organizer, title, target_funding, city, category_id], (error, result) => {
    if (error) {
      console.error('Insert fundraiser error:', error);
      return res.status(500).json({ message: 'Error adding fundraiser' });
    }

    res.status(201).json({ message: 'Fundraiser created successfully' });
  });
});


app.put('/fundraisers/:id', (req, res) => {
  const fundraiserId = req.params.id;
  const { organizer, title, target_funding, city, category_id } = req.body;

  const sql = 'UPDATE fundraisers SET organizer = ?, title = ?, target_funding = ?, city = ?, category_id = ? WHERE fundraiser_id = ?';
  connection.query(sql, [organizer, title, target_funding, city, category_id, fundraiserId], (error, result) => {
    if (error) {
      console.error('Update fundraiser error:', error);
      return res.status(500).json({ message: 'Error updating fundraiser' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Fundraiser not found' });
    }

    res.json({ message: 'Fundraiser updated successfully' });
  });
});


app.delete('/fundraisers/:id', (req, res) => {
  const fundraiserId = req.params.id;

  const checkDonationsSql = 'SELECT COUNT(*) AS donationCount FROM donation WHERE fundraiser_id = ?';
  connection.query(checkDonationsSql, [fundraiserId], (error, result) => {
    if (error) {
      console.error('Check donations error:', error);
      return res.status(500).json({ message: 'Error checking donations' });
    }

    if (result[0].donationCount > 0) {
      return res.status(400).json({ message: 'Cannot delete fundraiser with donations' });
    }

    const deleteSql = 'DELETE FROM fundraisers WHERE fundraiser_id = ?';
    connection.query(deleteSql, [fundraiserId], (deleteError, deleteResult) => {
      if (deleteError) {
        console.error('Delete fundraiser error:', deleteError);
        return res.status(500).json({ message: 'Error deleting fundraiser' });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({ message: 'Fundraiser not found' });
      }

      res.json({ message: 'Fundraiser deleted successfully' });
    });
  });
});




const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
