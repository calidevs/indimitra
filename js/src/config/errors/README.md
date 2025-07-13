# Error Handling

Simple error handling for GraphQL requests.

## Usage

### 1. GraphQL Service (Automatic Error Handling)

The `fetchGraphQL` function automatically converts technical errors to user-friendly messages:

```javascript
import fetchGraphQL from '@/config/graphql/graphqlService';

try {
  const response = await fetchGraphQL(CREATE_ORDER_MUTATION, variables);
  // Success
} catch (error) {
  // error.message is already user-friendly
  setError(error.message);
}
```

### 2. Error Display Component

Use the `ErrorHandler` component to display errors:

```javascript
import { ErrorHandler } from '@/components';

{error && (
  <ErrorHandler
    error={error}
    title="Order Error"
  />
)}
```

### 3. Adding New Error Messages

Edit `js/src/config/errors/errorMessages.js`:

```javascript
export const ERROR_MESSAGES = {
  // Add your new error here
  NEW_ERROR_CODE: 'Your user-friendly message',
};
```

## Error Types Handled

- **Authentication**: Login required, permission denied
- **Orders**: Not found, cancelled, inventory issues
- **Network**: Connection errors, timeouts
- **Validation**: Input errors, invalid data
- **Server**: Internal errors, service unavailable

## Simple Example

```javascript
import fetchGraphQL from '@/config/graphql/graphqlService';
import { ErrorHandler } from '@/components';

const MyComponent = () => {
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await fetchGraphQL(CREATE_ORDER_MUTATION, variables);
      // Success
    } catch (error) {
      setError(error.message); // Already user-friendly
    }
  };

  return (
    <div>
      {error && (
        <ErrorHandler
          error={error}
          title="Submit Error"
        />
      )}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
``` 