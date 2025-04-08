import { _decorator } from 'cc';
import { PopupProcessLoading } from '../PopupProcessLoading';

const { ccclass } = _decorator;

/**
 * Loading popup specifically for the pitch mode
 */
@ccclass('PopupPitchLoading')
export class PopupPitchLoading extends PopupProcessLoading {
    // Add any pitch-specific loading functionality here
} 