# 🎲 Test Data Generator - Прості функції

## Як використовувати:

### Створити користувача
```typescript
import { 
  generateEmail, 
  generateFirstName, 
  generateLastName 
} from '../../helpers/test-data-generator';

const userData = {
  email: generateEmail(),           // test.1234567890@example.com
  first_name: generateFirstName(),  // John
  last_name: generateLastName(),    // Doe
};
```

### Випадковий вибір
```typescript
import { randomPick } from '../../helpers/test-data-generator';

const role = randomPick(['Admin', 'User', 'Guest']);
```

## Всі функції:

### Унікальні дані (з timestamp):
- `generateEmail()` - test.123@example.com
- `generateUsername()` - user_123
- `generateSlug()` - test-123

### Реалістичні дані (через Faker):
- `generateFirstName()` - John
- `generateLastName()` - Doe
- `generateFullName()` - John Doe
- `generatePhone()` - +1-234-567-8900
- `generateCompanyName()` - Acme Corp
- `generateStreet()` - 123 Main St
- `generateCity()` - New York
- `generateState()` - NY

### Utility:
- `randomPick(array)` - випадковий елемент
- `randomNumber(min, max)` - випадкове число

## Приклад:
📄 [tests/examples/simple-faker.example.spec.ts](../tests/examples/simple-faker.example.spec.ts)
