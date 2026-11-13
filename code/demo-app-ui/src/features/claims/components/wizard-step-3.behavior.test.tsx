import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WizardStep3 } from './wizard-step-3';
import { useClaimWizardStore } from '../stores/use-claim-wizard-store';

const mocks = vi.hoisted(() => ({ submit: vi.fn(), push: vi.fn() }));
vi.mock('@/src/lib/api/bff-client', () => ({ claimsApi: { submitClaim: mocks.submit } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const draft = {
  incidentDate: new Date(2026, 0, 1),
  incidentLocation: '123 Main Street',
  description: 'Vehicle damaged in a collision',
  claimAmount: 500,
};
const savedClaim = { claimId: 'saved-claim-id', status: 'SUBMITTED' };

describe('Claim review with the real wizard store', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useClaimWizardStore.getState().resetWizard();
    useClaimWizardStore.getState().updateFormData(draft);
    useClaimWizardStore.getState().setStep(3);
  });
  afterEach(() => {
    cleanup();
    useClaimWizardStore.getState().resetWizard();
  });

  it('keeps the draft visible after a server failure and allows a successful retry', async () => {
    mocks.submit.mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce(savedClaim);
    const user = userEvent.setup();
    render(<WizardStep3 />);
    await user.click(screen.getByRole('button', { name: 'Submit Claim' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to submit claim. Please try again.');
    expect(screen.getByText(draft.description)).toBeVisible();
    expect(screen.getByText(draft.incidentLocation)).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Submit Claim' }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/claims'));
    expect(mocks.submit).toHaveBeenCalledTimes(2);
  });

  it('blocks repeated submission and back navigation while the request is pending', async () => {
    let complete!: (value: typeof savedClaim) => void;
    mocks.submit.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    const user = userEvent.setup();
    render(<WizardStep3 />);
    await user.click(screen.getByRole('button', { name: 'Submit Claim' }));
    const pending = screen.getByRole('button', { name: /Submitting/ });
    expect(pending).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    await user.click(pending);
    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
    await act(async () => { complete(savedClaim); });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/claims'));
  });

  it('submits the reviewed values and navigates only after the server accepts them', async () => {
    mocks.submit.mockResolvedValue(savedClaim);
    const user = userEvent.setup();
    render(<WizardStep3 />);
    expect(screen.getByText('$500.00')).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Submit Claim' }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledExactlyOnceWith('/claims'));
    expect(mocks.submit).toHaveBeenCalledExactlyOnceWith({ submitClaimRequest: draft });
  });
});
