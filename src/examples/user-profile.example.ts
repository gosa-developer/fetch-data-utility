import { fetchData } from '../utils/fetchData';
import { FetchResponse } from '../types/fetch.types';

// Define your data types
interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

/**
 * Example 1: Basic user profile fetch
 */
async function fetchUserProfile(userId: number): Promise<void> {
  console.log(`Fetching profile for user ${userId}...`);

  const response = await fetchData<UserProfile>({
    url: `https://jsonplaceholder.typicode.com/users/${userId}`,
    method: 'GET',
    timeout: 5000,
    retries: 3,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  // Clean, try/catch-free error handling
  if (!response.success) {
    handleFetchError(response.error);
    return;
  }

  // TypeScript knows response.data is UserProfile here
  console.log('✅ User profile loaded successfully:');
  console.log(`Name: ${response.data.name}`);
  console.log(`Email: ${response.data.email}`);
  console.log(`Role: ${response.data.role || 'user'}`);
}

/**
 * Example 2: Creating a new resource
 */
async function createPost(): Promise<void> {
  const newPost = {
    title: 'My New Post',
    body: 'This is the content of my post',
    userId: 1,
  };

  const response = await fetchData<ApiResponse<any>>({
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'POST',
    timeout: 8000,
    retries: 2,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newPost),
  });

  if (!response.success) {
    handleFetchError(response.error);
    return;
  }

  console.log('✅ Post created successfully:', response.data);
}

/**
 * Example 3: Simulating network failures and retries
 */
async function testRetryMechanism(): Promise<void> {
  console.log('Testing retry mechanism with a failing endpoint...');

  // This endpoint doesn't exist - will trigger retries
  const response = await fetchData({
    url: 'https://jsonplaceholder.typicode.com/non-existent-endpoint',
    method: 'GET',
    retries: 3,
    retryDelay: 1000,
    timeout: 3000,
  });

  if (!response.success) {
    console.log('\n📊 Retry Test Results:');
    console.log(`Error Type: ${response.error.type}`);
    console.log(`Message: ${response.error.message}`);
    if (response.error.status) {
      console.log(`Status Code: ${response.error.status}`);
    }
  }
}

/**
 * Example 4: Batch requests
 */
async function fetchMultipleUsers(userIds: number[]): Promise<void> {
  console.log(`\nFetching ${userIds.length} users concurrently...`);

  const promises = userIds.map(id => 
    fetchData<UserProfile>({
      url: `https://jsonplaceholder.typicode.com/users/${id}`,
      method: 'GET',
      timeout: 5000,
      retries: 2,
    })
  );

  const responses = await Promise.all(promises);

  const successfulUsers: UserProfile[] = [];
  const failedRequests: Array<{ id: number; error: any }> = [];

  responses.forEach((response, index) => {
    if (response.success) {
      successfulUsers.push(response.data);
    } else {
      failedRequests.push({
        id: userIds[index],
        error: response.error,
      });
    }
  });

  console.log(`✅ Successful: ${successfulUsers.length}`);
  console.log(`❌ Failed: ${failedRequests.length}`);

  if (failedRequests.length > 0) {
    console.log('Failed requests:', failedRequests);
  }
}

/**
 * Helper function to handle different error types
 */
function handleFetchError(error: any): void {
  switch (error.type) {
    case 'timeout':
      console.error('⏰ Timeout Error:', error.message);
      console.error('The server is taking too long to respond. Please try again.');
      break;
    
    case 'network':
      console.error('📡 Network Error:', error.message);
      console.error('Please check your internet connection and try again.');
      break;
    
    case 'http':
      console.error(`🌐 HTTP Error (${error.status}):`, error.message);
      if (error.status === 404) {
        console.error('The requested resource was not found.');
      } else if (error.status === 401 || error.status === 403) {
        console.error('You do not have permission to access this resource.');
      } else if (error.status >= 500) {
        console.error('Server error. Please try again later.');
      }
      break;
    
    default:
      console.error('❌ Unknown Error:', error.message);
  }
}

/**
 * Run all examples
 */
async function runExamples(): Promise<void> {
  console.log('🚀 Starting fetchData Utility Examples\n');
  console.log('='.repeat(50));

  try {
    // Example 1: Basic fetch
    await fetchUserProfile(1);
    console.log('\n' + '-'.repeat(50));

    // Example 2: Create post
    await createPost();
    console.log('\n' + '-'.repeat(50));

    // Example 3: Retry mechanism
    await testRetryMechanism();
    console.log('\n' + '-'.repeat(50));

    // Example 4: Batch requests
    await fetchMultipleUsers([1, 2, 3, 999]); // 999 will fail (404)

    console.log('\n' + '='.repeat(50));
    console.log('✅ All examples completed!');

  } catch (error) {
    console.error('Unexpected error in examples:', error);
  }
}

// Run the examples
runExamples();