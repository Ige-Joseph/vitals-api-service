import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { swaggerSpec } from "./config/swagger";
import { requestLoggerMiddleware } from "./shared/middleware/requestLogger.middleware";
import { notFoundMiddleware } from "./shared/middleware/notFound.middleware";
import { errorMiddleware } from "./shared/middleware/error.middleware";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLoggerMiddleware);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);