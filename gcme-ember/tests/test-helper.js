import Application from '../app';
import config from '../config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';
import QUnit from 'qunit';

QUnit.config.testTimeout = 120000;

setApplication(Application.create(config.APP));

start();
