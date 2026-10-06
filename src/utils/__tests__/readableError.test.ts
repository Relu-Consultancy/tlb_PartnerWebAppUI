import { describe, it, expect } from 'vitest';
import { readableErrorMessage } from '../readableError';

// Verbatim from QA's screenshot of the onboarding submit.
const QA_DUMP =
    "{'business_name': [ErrorDetail(string='This field may not be blank.', code='blank')], 'contact_person_name': [ErrorDetail(string='This field may not be blank.', code='blank')], 'email': [ErrorDetail(string='This field may not be blank.', code='blank')], 'base_city': [ErrorDetail(string='This field may not be blank.', code='blank')], 'instagram_url': [ErrorDetail(string='Enter a valid URL.', code='invalid')]}";

describe('readableErrorMessage', () => {
    it('turns a DRF ErrorDetail dump into one plain sentence', () => {
        expect(readableErrorMessage(QA_DUMP)).toBe(
            'Please fill in Business / brand name, Contact person name, Email and City. Instagram link: Enter a valid URL.'
        );
    });

    it('keeps quotes inside a message intact', () => {
        const dump = "{'identifier_type': [ErrorDetail(string='\"phone\" is not a valid choice.', code='invalid_choice')]}";
        expect(readableErrorMessage(dump)).toBe('Sign-in method: "phone" is not a valid choice.');
    });

    it('reads JSON validation objects too, including ones nested under error/details', () => {
        expect(readableErrorMessage('{"email": ["Enter a valid email address."]}')).toBe('Email: Enter a valid email address.');
        expect(readableErrorMessage('{"error": {"code": "VALIDATION_ERROR", "details": {"base_city": ["This field is required."]}}}')).toBe(
            'Please fill in City.'
        );
        expect(readableErrorMessage('{"non_field_errors": ["Partner already exists"]}')).toBe('Partner already exists.');
    });

    it('labels unknown fields readably', () => {
        expect(readableErrorMessage("{'gst_number': [ErrorDetail(string='Invalid format.', code='invalid')]}")).toBe(
            'Gst number: Invalid format.'
        );
    });

    it('leaves ordinary messages alone and hides unreadable dumps', () => {
        expect(readableErrorMessage('Failed to load bookings')).toBe('Failed to load bookings');
        expect(readableErrorMessage('<!DOCTYPE html><html>502</html>')).toBe('Something went wrong. Please try again.');
        expect(readableErrorMessage('[1, 2')).toBe('Something went wrong. Please try again.');
        expect(readableErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    });
});

describe('readableErrorMessage — QA: support ticket subject too long', () => {
    it('reads a max_length refusal plainly', () => {
        const dump = "{'subject': [ErrorDetail(string='Ensure this field has no more than 200 characters.', code='max_length')]}";
        expect(readableErrorMessage(dump)).toBe('Subject: Ensure this field has no more than 200 characters.');
    });
});
