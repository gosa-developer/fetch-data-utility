import { fetchData } from './utils/fetchData';
import { FetchResponse } from './types/fetch.types';

// Simple demo with a public API
async function main() {
  console.log('📡 fetchData Utility Demo');
  console.log('=========================\n');

  // Example 1: Successful GET request
  console.log('1. Making a successful GET request...');
  const todoResponse = await fetchData<{ id: number; title: string; completed: boolean }>({
    url: 'https://jsonplaceholder.typicode.com/todos/1',
    method: 'GET',
    timeout: 5000,
  });

  if (todoResponse.success) {
    console.log('✅ Success! Todo:', todoResponse.data);
  } else {
    console.log('❌ Failed:', todoResponse.error.message);
  }

  console.log('\n-------------------\n');

  // Example 2: Request with timeout simulation
  console.log('2. Testing timeout (will abort after 1 second)...');
  const timeoutResponse = await fetchData({
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    timeout: 1, // Extremely short timeout
  });

  if (!timeoutResponse.success) {
    console.log(`❌ Expected timeout error: ${timeoutResponse.error.type} - ${timeoutResponse.error.message}`);
  }

  console.log('\n-------------------\n');

  // Example 3: Failed request (404)
  console.log('3. Testing 404 error...');
  const notFoundResponse = await fetchData({
    url: 'https://jsonplaceholder.typicode.com/nonexistent',
    method: 'GET',
  });

  if (!notFoundResponse.success) {
    console.log(`❌ Expected 404 error: ${notFoundResponse.error.type} - ${notFoundResponse.error.message}`);
    if (notFoundResponse.error.status === 404) {
      console.log('✅ Error correctly identified as 404!');
    }
  }
}

// Run the demo
main().catch(console.error);