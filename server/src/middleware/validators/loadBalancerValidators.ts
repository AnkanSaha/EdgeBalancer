import { body } from 'express-validator';
import { WORKER_SCRIPT_NAME_REGEX } from '../../utils/workerName';

export const createLoadBalancerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Load balancer name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be between 3 and 50 characters')
    .matches(WORKER_SCRIPT_NAME_REGEX)
    .withMessage('Name must use only lowercase letters, numbers, and hyphens'),

  body('domain')
    .trim()
    .notEmpty()
    .withMessage('Domain is required')
    .isLength({ min: 3, max: 253 })
    .withMessage('Domain must be between 3 and 253 characters')
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/)
    .withMessage('Invalid domain format'),

  body('subdomain')
    .optional()
    .trim()
    .isLength({ max: 63 })
    .withMessage('Subdomain must not exceed 63 characters')
    .matches(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/)
    .withMessage('Invalid subdomain format'),

  body('zoneId')
    .trim()
    .notEmpty()
    .withMessage('Zone ID is required')
    .isLength({ min: 32, max: 32 })
    .withMessage('Zone ID must be 32 characters'),

  body('origins')
    .isArray({ min: 1 })
    .withMessage('At least one origin server is required'),

  body('origins.*.url')
    .trim()
    .notEmpty()
    .withMessage('Origin URL is required')
    .matches(/^https?:\/\/.+/)
    .withMessage('Origin URL must start with http:// or https://'),

  body('origins.*.weight')
    .isInt({ min: 1, max: 100 })
    .withMessage('Weight must be an integer between 1 and 100'),

  body('origins.*.geoCountries')
    .optional()
    .isArray()
    .withMessage('geoCountries must be an array'),

  body('origins.*.geoCountries.*')
    .optional()
    .trim()
    .matches(/^[A-Z]{2}$/)
    .withMessage('Geo country codes must use 2-letter uppercase ISO country codes'),

  body('origins.*.geoColos')
    .optional()
    .isArray()
    .withMessage('geoColos must be an array'),

  body('origins.*.geoColos.*')
    .optional()
    .trim()
    .matches(/^[A-Z0-9]{3,4}$/)
    .withMessage('Geo colo codes must use 3-4 uppercase letters or digits'),

  body('origins.*.geoContinents')
    .optional()
    .isArray()
    .withMessage('geoContinents must be an array'),

  body('origins.*.geoContinents.*')
    .optional()
    .trim()
    .matches(/^(AF|AN|AS|EU|NA|OC|SA)$/)
    .withMessage('Geo continent codes must be one of AF, AN, AS, EU, NA, OC, SA'),

  body('strategy')
    .trim()
    .notEmpty()
    .withMessage('Strategy is required')
    .isIn([
      'round-robin',
      'weighted-round-robin',
      'ip-hash',
      'cookie-sticky',
      'weighted-cookie-sticky',
      'failover',
      'geo-steering',
    ])
    .withMessage('Strategy must be a supported routing mode'),

  body('weightedEnabled')
    .isBoolean()
    .withMessage('weightedEnabled must be a boolean'),

  body('placement')
    .isObject()
    .withMessage('Placement configuration is required'),

  body('placement.smartPlacement')
    .optional()
    .isBoolean()
    .withMessage('smartPlacement must be a boolean'),

  body('placement.region')
    .optional()
    .trim()
    .matches(/^(aws|gcp|azure):[a-z0-9-]+$/)
    .withMessage('Region must be in format "provider:region" (e.g., aws:us-east-1)'),
];
