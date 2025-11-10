import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Zap, PartyPopper } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  levelName: string;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ isOpen, onClose, level, levelName }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-sm overflow-hidden">
        <DialogHeader>
          <div className="w-20 h-20 bg-yellow-400/20 rounded-full mx-auto flex items-center justify-center border-4 border-yellow-400">
            <Zap className="h-10 w-10 text-yellow-300" fill="currentColor" />
          </div>
          <DialogTitle className="text-center text-3xl font-bold mt-4">
            LEVEL UP!
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-gray-300">
            You've reached <span className="text-white font-semibold">Level {level}: {levelName}</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-bold" 
            onClick={onClose}
          >
            Awesome!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LevelUpModal;
