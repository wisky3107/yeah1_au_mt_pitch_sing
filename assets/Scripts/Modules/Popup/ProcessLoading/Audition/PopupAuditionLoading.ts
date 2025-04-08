import { _decorator } from 'cc';
import { PopupProcessLoading } from '../PopupProcessLoading';

const { ccclass } = _decorator;

/**
 * Loading popup specifically for the audition mode
 */
@ccclass('PopupAuditionLoading')
export class PopupAuditionLoading extends PopupProcessLoading {
    // Add any audition-specific loading functionality here
} 