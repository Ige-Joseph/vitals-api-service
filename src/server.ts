import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const PORT = process.env.PORT || env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
