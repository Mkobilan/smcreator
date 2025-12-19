import React from 'react';
import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const deliveryMethods = [
  {
    id: 'standard',
    title: 'Standard',
    turnaround: '4–10 business days',
    price: 5.00,
  },
  {
    id: 'express',
    title: 'Express',
    turnaround: '2–5 business days',
    price: 15.00,
  },
  {
    id: 'priority',
    title: 'Priority',
    turnaround: '1–3 business days',
    price: 25.00,
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ShippingMethodSelector({ selectedMethod, setSelectedMethod }) {
  return (
    <div className="mt-6">
      <RadioGroup value={selectedMethod} onChange={setSelectedMethod}>
        <RadioGroup.Label className="text-lg font-medium text-gray-900">Shipping Method</RadioGroup.Label>

        <div className="mt-4 grid grid-cols-1 gap-y-4">
          {deliveryMethods.map((deliveryMethod) => (
            <RadioGroup.Option
              key={deliveryMethod.id}
              value={deliveryMethod}
              className={({ checked, active }) =>
                classNames(
                  checked ? 'border-transparent' : 'border-gray-300',
                  active ? 'border-primary-500 ring-2 ring-primary-500' : '',
                  'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none'
                )
              }
            >
              {({ checked, active }) => (
                <>
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <RadioGroup.Label as="span" className="block text-sm font-medium text-gray-900">
                        {deliveryMethod.title}
                      </RadioGroup.Label>
                      <RadioGroup.Description
                        as="span"
                        className="mt-1 flex items-center text-sm text-gray-500"
                      >
                        {deliveryMethod.turnaround}
                      </RadioGroup.Description>
                      <RadioGroup.Description as="span" className="mt-1 text-sm font-medium text-gray-900">
                        ${deliveryMethod.price.toFixed(2)}
                      </RadioGroup.Description>
                    </span>
                  </span>
                  {checked ? (
                    <CheckCircleIcon
                      className="h-5 w-5 text-primary-600"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={classNames(
                      active ? 'border' : 'border-2',
                      checked ? 'border-primary-500' : 'border-transparent',
                      'pointer-events-none absolute -inset-px rounded-lg'
                    )}
                    aria-hidden="true"
                  />
                </>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
}
