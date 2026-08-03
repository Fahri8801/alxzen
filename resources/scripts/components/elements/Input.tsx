import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';

export interface Props {
    isLight?: boolean;
    hasError?: boolean;
}

const light = css<Props>`
    ${tw`bg-white border-neutral-200 text-neutral-800`};
    &:focus {
        ${tw`border-primary-400`}
    }

    &:disabled {
        ${tw`bg-neutral-100 border-neutral-200`};
    }
`;

const checkboxStyle = css<Props>`
    ${tw`bg-neutral-500 cursor-pointer appearance-none inline-block align-middle select-none flex-shrink-0 w-4 h-4 text-primary-400 border border-neutral-300 rounded-sm`};
    color-adjust: exact;
    background-origin: border-box;
    transition: all 75ms linear, box-shadow 25ms linear;

    &:checked {
        ${tw`border-transparent bg-no-repeat bg-center`};
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-color: currentColor;
        background-size: 100% 100%;
    }

    &:focus {
        ${tw`outline-none border-primary-300`};
        box-shadow: 0 0 0 1px rgba(9, 103, 210, 0.25);
    }
`;

const inputStyle = css<Props>`
    // Reset to normal styling.
    resize: none;
    ${tw`appearance-none outline-none w-full min-w-0`};
    ${tw`p-3 border-2 text-sm transition-all duration-150`};
    border-radius: 0;
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(229, 9, 20, 0.2);
    color: #cbd5e1;
    box-shadow: none;

    &::placeholder {
        color: #374151;
    }

    & + .input-help {
        ${tw`mt-1 text-xs`};
        color: ${(props: Props) => props.hasError ? '#fca5a5' : '#4b5563'};
    }

    &:required,
    &:invalid {
        ${tw`shadow-none`};
    }

    &:not(:disabled):not(:read-only):focus {
        outline: none;
        border-color: rgba(124, 58, 237, 0.6);
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12), 0 0 14px rgba(124, 58, 237, 0.15);
        background: rgba(124, 58, 237, 0.04);
        ${(props: Props) => props.hasError && tw`border-red-400`};
    }

    &:disabled {
        ${tw`opacity-50`};
    }

    ${(props: Props) => props.isLight && light};
    ${(props: Props) => props.hasError && `border-color: rgba(239,68,68,0.6); color: #fca5a5;`};
`;

const Input = styled.input<Props>`
    &:not([type='checkbox']):not([type='radio']) {
        ${inputStyle};
    }

    &[type='checkbox'],
    &[type='radio'] {
        ${checkboxStyle};

        &[type='radio'] {
            ${tw`rounded-full`};
        }
    }
`;
const Textarea = styled.textarea<Props>`
    ${inputStyle}
`;

export { Textarea };
export default Input;
