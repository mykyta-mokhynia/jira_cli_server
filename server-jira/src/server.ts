import app from './app';
import { config } from './config/env';

const PORT = config.PORT;

app.listen(PORT, () => {
    console.log(`Server-Jira is running on port ${PORT}`);
    console.log(`Standalone readiness: OK`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});
