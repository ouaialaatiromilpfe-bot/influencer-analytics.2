const response = await fetch('/api/instagram', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ username }),
});

const data = await response.json();