import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'NOOKK STUDIO API',
      version: '1.0.0',
      description:
        'REST API for the NOOKK STUDIO luxury interior design portfolio — public content endpoints plus a JWT-protected admin panel.',
    },
    servers: [{ url: `/api`, description: 'Current server (relative)' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Health' },
      { name: 'Auth' },
      { name: 'Projects' },
      { name: 'Services' },
      { name: 'Journal' },
      { name: 'Inquiries' },
      { name: 'Testimonials' },
      { name: 'Admin - Projects' },
      { name: 'Admin - Services' },
      { name: 'Admin - Journal' },
      { name: 'Admin - Inquiries' },
      { name: 'Admin - Testimonials' },
      { name: 'Admin - Upload' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
