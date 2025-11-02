import express from 'express';
import { serve } from 'inngest/express';
import { inngest } from '../lib/inngest.js';
import { 
  syncUserFromClerk, 
  updateUserFromClerk, 
  deleteUserFromClerk 
} from '../functions/user-sync.js';

const router = express.Router();

// Create the Inngest handler
const handler = serve({
  client: inngest,
  functions: [
    syncUserFromClerk,
    updateUserFromClerk,
    deleteUserFromClerk,
  ],
});

// Handle all HTTP methods for Inngest
router.all('/', (req, res) => {
  return handler(req, res);
});

export default router;