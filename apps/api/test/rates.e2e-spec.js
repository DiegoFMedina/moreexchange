"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
const transform_interceptor_1 = require("../src/common/interceptors/transform.interceptor");
const http_exception_filter_1 = require("../src/common/filters/http-exception.filter");
describe('GET /v1/rates (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('v1');
        app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('devuelve 200 con formato { success: true, data: [...] }', async () => {
        const response = await request(app.getHttpServer())
            .get('/v1/rates')
            .expect(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('timestamp');
        expect(response.body.meta).toHaveProperty('version', '1.0');
    });
});
//# sourceMappingURL=rates.e2e-spec.js.map