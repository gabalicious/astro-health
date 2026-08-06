import type { APIRoute } from 'astro';
import { app } from '@/server/app';

export const prerender = false;

export const ALL: APIRoute = (context) => app.fetch(context.request);
