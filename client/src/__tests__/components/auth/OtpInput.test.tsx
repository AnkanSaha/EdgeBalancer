import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { OtpInput } from '@/components/auth/OtpInput';

function Harness({ onComplete }: { onComplete: (value: string) => void }) {
  const [value, setValue] = useState('');
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} />;
}

const field = () => screen.getByLabelText('6-digit authentication code');

describe('OtpInput', () => {
  it('submits itself once the sixth digit lands, with no button', async () => {
    const onComplete = jest.fn();
    render(<Harness onComplete={onComplete} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    await userEvent.type(field(), '12345');
    expect(onComplete).not.toHaveBeenCalled();

    await userEvent.type(field(), '6');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('ignores non-digits and stops at six', async () => {
    const onComplete = jest.fn();
    render(<Harness onComplete={onComplete} />);

    await userEvent.type(field(), '12ab34cd5678');

    expect(field()).toHaveValue('123456');
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('a pasted code submits once', async () => {
    const onComplete = jest.fn();
    render(<Harness onComplete={onComplete} />);

    await userEvent.click(field());
    await userEvent.paste('654321');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('654321');
  });
});
