/**
 * Chat module type surface.
 * Single source of truth is the contract layer (spec.md R2.2): this file only
 * re-exports the shared API types — no new type definitions here.
 */
export type { ChatMessage, ChatRequest, ChatResponse, ChatRole } from '@repo/shared-types';
