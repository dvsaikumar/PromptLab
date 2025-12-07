import { expect, test, describe } from 'vitest';
import { FRAMEWORKS } from './constants';

describe('Framework Definitions', () => {
    test('All frameworks should have required properties', () => {
        FRAMEWORKS.forEach(framework => {
            expect(framework.id).toBeDefined();
            expect(framework.name).toBeDefined();
            expect(framework.description).toBeDefined();
            expect(framework.fields).toBeInstanceOf(Array);
            expect(framework.fields.length).toBeGreaterThan(0);
        });
    });

    test('New frameworks should be present', () => {
        const newIds = ['c4', 'devops', 'ddd', 'roses', 'tracer'];
        newIds.forEach(id => {
            const fw = FRAMEWORKS.find(f => f.id === id);
            expect(fw, `Framework ${id} should be present`).toBeDefined();
            expect(fw?.fields.length).toBeGreaterThan(0);
        });
    });

    test('All fields in frameworks should be valid', () => {
        FRAMEWORKS.forEach(framework => {
            framework.fields.forEach(field => {
                expect(field.id).toBeDefined();
                expect(field.label).toBeDefined();
                expect(field.description).toBeDefined();
            });
        });
    });

    test('Framework IDs should be unique', () => {
        const ids = FRAMEWORKS.map(f => f.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });
});
