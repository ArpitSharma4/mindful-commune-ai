import { JournalingPage } from '@/features/journaling';
import Header from '@/components/Header';

const Journaling = () => {
  try {
    return (
      <>
        <Header />
        <JournalingPage />
      </>
    );
  } catch (error) {
    console.error('Error rendering Journaling page:', error);
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Error Loading Journal</h1>
              <p className="text-muted-foreground">
                There was an error loading the journal page. Please try refreshing the page.
              </p>
              <p className="text-sm text-red-600 mt-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </div>
        </div>
      </>
    );
  }
};

export default Journaling;
