import { _decorator } from 'cc';
import { PopupProcessLoading } from '../PopupProcessLoading';

const { ccclass } = _decorator;

/**
 * Loading popup specifically for the karaoke mode
 */
@ccclass('PopupKaraokeLoading')
export class PopupKaraokeLoading extends PopupProcessLoading {
    // Add any karaoke-specific loading functionality here
} 