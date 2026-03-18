import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/pesadas/agrupadas'; // Ajustar si el puerto es distinto

async function test() {
  let page = 1;
  let totalLoaded = 0;
  let allIds = new Set();

  while (page < 20) {
    console.log(`\n--- Fetching Page ${page} ---`);
    try {
      const res = await fetch(`${API_URL}?page=${page}&limit=50`, {
        headers: {
          'x-user-id': '1',
          'x-username': 'admin'
        }
      });
      if (!res.ok) {
        console.error(`Error: ${res.status}`);
        break;
      }
      const json = await res.json();
      console.log(`Rows: ${json.data.length}, Total: ${json.total}, hasMore: ${json.hasMore}`);
      
      if (json.data.length === 0) {
        console.log('No more data returned.');
        break;
      }

      let dups = 0;
      json.data.forEach(item => {
        if (allIds.has(item.id)) dups++;
        allIds.add(item.id);
      });

      if (dups > 0) {
        console.warn(`WARNING: Found ${dups} duplicates in this page!`);
      }

      totalLoaded += json.data.length;
      console.log(`Cumulative Unique Items: ${allIds.size}`);

      if (!json.hasMore) {
        console.log('hasMore is false. Stopping.');
        break;
      }
      page++;
    } catch (err) {
      console.error(err);
      break;
    }
  }
}

test();
